/**
 * AI Text Summarizer Backend Server
 *
 * This Express.js server handles authentication, session management,
 * and AI-powered text summarization using Cohere AI and DistilBART fallback.
 * It uses PostgreSQL for user data storage and Passport.js for authentication.
 */

import 'dotenv/config'; // Load environment variables from .env

// Express framework imports
import express from 'express';

// PostgreSQL client
import { Pool } from 'pg';

// Password hashing
import bcrypt from 'bcrypt';

// Enable Cross-Origin Resource Sharing
import cors from 'cors';

// Session management
import session from 'express-session';

// Authentication with Passport.js
import passport from 'passport';
import { Strategy } from 'passport-local'; // Local strategy for username/password auth
import { Strategy as GoogleStrategy } from 'passport-google-oauth2'; // Google OAuth strategy

// PostgreSQL session store
import pgSession from 'connect-pg-simple';



// AI clients
import { CohereClientV2 } from 'cohere-ai';
import { InferenceClient } from '@huggingface/inference';

// PostgreSQL connection pool for database operations
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.HOST,
    database: process.env.DB,
    password: process.env.PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
    ssl: { rejectUnauthorized: false } // Allow self-signed certificates in production
});

// PostgreSQL session store for persistent sessions
const PostgreSqlStore = pgSession(session);

// Initialize Express application
const app = express();
app.set('trust proxy', 1); // Trust proxy for secure cookies behind reverse proxy
app.use(cors({ origin: 'https://clario-alpha.vercel.app', credentials: true })); // Enable CORS with credentials for frontend
app.use(express.json()); // Middleware to parse JSON request bodies

// Session configuration with PostgreSQL store
app.use(
    session({
      store: new PostgreSqlStore({
        pool: pool,
        tableName: 'user_session',
        createTableIfMissing: true // Auto-create session table if it doesn't exist
      }),
      secret: process.env.SESSION_SECRET, // Secret key for signing session cookies
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 60, // 2 months session duration
        httpOnly: true, // Prevent client-side access to cookies
        secure: true,   // HTTPS only in production
        sameSite: 'none' // Allow cross-site requests
      }
    })
);

// Initialize Passport.js for authentication
app.use(passport.initialize());
app.use(passport.session());



// Port configuration - defaults to 3000 if not set in environment
const port = process.env.PORT || 3000;

// Initialize AI service clients
const co = new CohereClientV2({ token: process.env.CO_API_KEY }); // Cohere AI client for primary summarization
const client = new InferenceClient(process.env.HF_TOKEN); // Hugging Face client for fallback summarization

/**
 * Generates AI instruction prompts for text summarization
 * @param {string} text - The text to be summarized
 * @param {boolean} main - Whether to use detailed instructions (true) or minimal (false)
 * @returns {string} Formatted instruction string for AI model
 */
const instruction = (text, main) => {
    if (main) {
        // Detailed instructions for Cohere AI summarization
        return `
        You are an intelligent summarizer for educational material, such as research papers, textbooks, or student notes.

        Instructions:
        1. Write a short, clear, and simple summary in plain text. **Do not use bold, italics, asterisks, or any Markdown formatting**.
        2. Explain the material in simple language as if teaching a student, avoiding complex terms unless necessary.
        3. Start with a brief paragraph summarizing the main ideas in an easy-to-understand way.
        4. Below the paragraph, list the key points on separate lines, each starting with a simple dash or bullet. Keep them minimal and easy to read.
        5. Use natural spacing, line breaks, and indentation for readability in a web browser.
        6. Do not include headings, labels like "Summary" or "Document Type", mindmaps, or any extra formatting.

        Produce a clean, plain text summary that is concise, easy to read, and structured for display on a web page.

        Here is the text to summarize:
        ${text}
`;
    } else {
        // Minimal input for DistilBART fallback
        return text;
    }
};

/**
 * Middleware function to verify user authentication
 * Checks if the request contains a valid authenticated session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function isAuthorized(req, res, next) {
    if (req.isAuthenticated()) {
        next(); // User is authenticated, proceed to next middleware
    } else {
        res.status(401).json({ loggedIn: false }); // Authentication failed
    }
}

/*
 * Google OAuth routes (currently commented out)
 * Uncomment and configure Google OAuth credentials to enable social login
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email'], // Request access to profile and email
}));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: true }),
    (req, res) => {
        // Successful login → user is attached to session
        res.redirect('/home'); // Redirect to main app or send JSON response
    }
);
*/

/**
 * Summarizes text using Cohere AI's advanced language model
 * @param {string} text - The text to summarize
 * @returns {Promise<string>} The summarized text
 */
async function summarizeUsingCohere(text) {
    const response = await co.chat({
        model: 'command-a-03-2025',
        messages: [{ role: 'user', content: instruction(text, true) }],
    });
    return response.message.content[0].text;
}

/**
 * Summarizes text using DistilBART model as fallback
 * @param {string} text - The text to summarize
 * @returns {Promise<string>} The summarized text
 */
async function summarizeUsingDistilbart(text) {
    const output = await client.summarization({
        model: 'sshleifer/distilbart-cnn-12-6',
        inputs: instruction(text, false),
        provider: 'hf-inference',
    });
    return output.summary_text;
}

/**
 * GET /check-session
 * Checks if the current user has an active session
 * Returns login status and user information if authenticated
 */
app.get('/check-session', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ loggedIn: true, user: req.user });
    } else {
        res.json({ loggedIn: false });
    }
});

/**
 * POST /login
 * Authenticates user with username and password using Passport local strategy
 * Body: { username: string, password: string }
 */
app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ error: 'Server error' });
        }

        if (!user) {
            return res.status(401).json(info);
        }

        // Establish user session upon successful authentication
        req.login(user, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Login failed' });
            }

            return res.status(200).json({
                message: 'Login successful',
                letter: user.letter
            });
        });
    })(req, res, next);
});

/**
 * POST /signUp
 * Registers a new user account
 * Body: { username: string, password: string, email: string }
 * Creates user in database and establishes session
 */
app.post('/signUp', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS);
        const hash = bcrypt.hashSync(password, saltRounds);

        // Extract first alphabetic letter from username for avatar display
        let fLetter;
        const Alphabets = /[a-zA-Z]/;

        for (let i = 0; i < username.length; i++) {
            if (Alphabets.test(username[i])) {
                fLetter = username[i].toUpperCase();
                break;
            }
        }

        // Insert new user record, handling duplicate usernames
        const cmd = 'INSERT INTO credentials (username, f_letter, email, hashpassword) VALUES ($1, $2, $3, $4) ON CONFLICT(username) DO NOTHING RETURNING *;';
        const values = [username, fLetter, email, hash];
        const result = await pool.query(cmd, values);

        if (result.rowCount === 0) {
            return res.status(409).json({ error: 'Username already exists' }); // Changed to 409 Conflict
        }

        const newUser = { id: result.rows[0].id };

        req.login(newUser, (err) => {
            if (err) console.error(err);
            res.status(200).json({ message: 'User signed up successfully', letter: fLetter });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An issue occurred during sign up' });
    }
});

/**
 * GET /logout
 * Destroys the current user session and logs out the user
 */
app.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.json({ message: 'Logged out successfully' });
    });
});

/**
 * POST /summarize
 * Generates AI-powered text summary (requires authentication)
 * Body: { text: string }
 * Special case: if text is 'whoami', returns a fun AI identity response
 */
app.post('/summarize', isAuthorized, async (req, res) => {
    const text = req.body.text;
    // This is a joke!
    if (text === 'whoami') {
        return res.json({ summary: 'I am Markie, an AI model trained by Makky.' });
    }

    try {
        const feedBack = await summarizeUsingCohere(text);
        res.json({ summary: feedBack });
    } catch (err) {
        console.error(err.statusCode, err.body?.message || err.message);

        // Fallback to DistilBART for errors like 404, 429, 500
        if ([404, 429, 500].includes(err.statusCode)) {
            console.log('Switching to Distilbart');
            try {
                const feedBack = await summarizeUsingDistilbart(text);
                return res.json({ summary: feedBack });
            } catch (fallbackErr) {
                console.error(fallbackErr.body?.message || fallbackErr.message);
                return res.status(500).json({ error: 'An issue occurred when summarizing text' });
            }
        }
    }
});

/*
 * Google OAuth Strategy (currently commented out)
 * Handles Google authentication and user creation/lookup
 * Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env to enable
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback: true
},
async (profile, cb) => {
    try {
        const email = profile.emails[0].value;
        const displayName = profile.displayName;
        const firstLetter = displayName ? displayName.charAt(0).toUpperCase() : 'U';

        // Check if user exists by email
        const cmd = 'SELECT * FROM credentials WHERE email = $1';
        const result = await pool.query(cmd, [email]);

        const baseUsername = 'N/A'; // Placeholder username for OAuth users
        const uniqueSuffix = Date.now(); // Generate unique suffix
        const username = `${baseUsername}_${uniqueSuffix}`;
        let user;
        if (result.rows.length === 0) {
            // Create new OAuth user with null password
            const insertCmd = 'INSERT INTO credentials (username, f_letter, email, hashpassword) VALUES ($1, $2, $3, $4) RETURNING *';
            const insertResult = await pool.query(insertCmd, [username, firstLetter, email, null]);
            user = { letter: insertResult.rows[0].f_letter };
        } else {
            user = { letter: result.rows[0].f_letter };
        }

        return cb(null, user);
    } catch (err) {
        return cb(err, null);
    }
}));
*/

/**
 * Passport Local Strategy for username/password authentication
 * Verifies user credentials against the database
 */
passport.use(new Strategy(async function verify(username, password, cb) {
    try {
        const cmd = 'SELECT * FROM credentials WHERE username = $1';
        const values = [username];

        // Query database for user by username
        const result = await pool.query(cmd, values);

        // If user not found, return authentication failure
        if (result.rows.length === 0) {
            return cb(null, false, { error: 'Username or password is incorrect' });
        }

        const data = result.rows[0];
        const hash = data.hashpassword;

        // Verify password using bcrypt
        const validate = bcrypt.compareSync(password, hash);
        if (!validate) {
            return cb(null, false, { error: 'Username or password is incorrect' });
        }

        // Return user object with ID for session storage
        const user = {
            id: data.id,
            letter: data.f_letter
        };

        return cb(null, user);
    } catch (err) {
        return cb(err);
    }
}));

/**
 * Passport serializeUser - stores user ID in session
 * @param {Object} user - User object
 * @param {Function} cb - Callback function
 */
passport.serializeUser((user, cb) => {
    cb(null, user.id); // Store only the user ID in the session
});

/**
 * Passport deserializeUser - retrieves full user object from database using ID
 * @param {string} id - User ID from session
 * @param {Function} cb - Callback function
 */
passport.deserializeUser(async (id, cb) => {
    try {
        // Fetch user data (first letter for avatar) by ID
        const result = await pool.query(
            'SELECT f_letter FROM credentials WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return cb(null, false); // User not found
        }

        const data = result.rows[0];
        const user = {
            id: id,
            letter: data.f_letter // First letter of username for avatar
        };

        cb(null, user);
    } catch (err) {
        cb(err);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
