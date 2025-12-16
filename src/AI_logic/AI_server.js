import 'dotenv/config';// Load environment variables from .env


// Express framework imports
import express from 'express';


// PostgreSQL client
import { Pool } from 'pg';

// Password hashing
import bcrypt from 'bcrypt';

// Enable Cross-Origin Resource Sharing
import cors from 'cors';

import session from 'express-session';

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';


// AI clients
import { CohereClientV2 } from 'cohere-ai';
import { InferenceClient } from '@huggingface/inference';

// Initialize Express app
const app = express();
app.use(cors({ origin: 'https://ai-platform-three-phi.vercel.app', credentials: true }));  // Enable CORS with credentials
app.use(express.json());  // Parse JSON request bodies
app.use(
    session({
        secret: String(process.env.SESSION_SECRET),
        resave: false,
        saveUninitialized: false,
        cookie:{
            maxAge: 1000 * 60 * 60 * 24 * 60,
            httpOnly: true,  // Security: prevent client-side access
            secure: true,    // Set to true in production with HTTPS
            sameSite: 'lax'
        }
    })
);
app.use(passport.initialize())
app.use(passport.session())

let Authorize = false

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://ai-server-hyua.onrender.com/auth/google/callback",
    passReqToCallback: true
},
async (request, accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const displayName = profile.displayName;
        const firstLetter = displayName ? displayName.charAt(0).toUpperCase() : 'U';

        // Check if user exists
        const cmd = 'SELECT * FROM credentials WHERE email = $1';
        const result = await pool.query(cmd, [email]);

        const baseUsername = 'N/A';
        const uniqueSuffix = Date.now(); // or generate random string
        const username = `${baseUsername}_${uniqueSuffix}`;
        let user;
        if (result.rows.length === 0) {
            // Create new user
            const insertCmd = 'INSERT INTO credentials (username, f_letter, email, hashpassword) VALUES ($1, $2, $3, $4) RETURNING *';
            const insertResult = await pool.query(insertCmd, [username, firstLetter, email, baseUsername]);
            user = insertResult.rows[0];
        } else {
            user = result.rows[0];
        }

        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const cmd = 'SELECT * FROM credentials WHERE id = $1';
        const result = await pool.query(cmd, [id]);
        done(null, result.rows[0]);
    } catch (err) {
        done(err, null);
    }
});


// PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.HOST,
    database: process.env.DB,
    password: process.env.PASSWORD,
    port: Number(process.env.PORT) || 5432,
    ssl: { rejectUnauthorized: false }
});

// Port the server will listen on
const port= process.env.PORT || 3000;

// Initialize AI clients
const co = new CohereClientV2({ token: process.env.CO_API_KEY });
const client = new InferenceClient(process.env.HF_TOKEN);

// Instruction generator for AI summarization
const instruction = (text, main) => {
    if (main) {
        // Returns a formatted instruction for summarization
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
        return text;
    }
};

// Middleware to check if user is authenticated via session
// Redirects to login page if not authenticated
function isAuthenticated(req, res, next){
    if(!Authorize){
        if(req.session.user){
            Authorize = true
            next(); //user is logged in
        } else{
            res.status(401).json({ loggedIn: false });
        }
    }else{
        next();
    }
    
}

// Summarize text using Cohere AI
async function summarizeUsingCohere(text) {
    const response= await co.chat({
        model: 'command-a-03-2025',
        messages: [{ role: 'user', content: instruction(text, true) }],
    });
    return response.message.content[0].text;
}

// Summarize text using DistilBART (fallback)
async function summarizeUsingDistilbart(text) {
    const output = await client.summarization({
        model: 'sshleifer/distilbart-cnn-12-6',
        inputs: instruction(text, false),
        provider: 'hf-inference',
    });
    return output.summary_text;
}

// Endpoint to check if user session is active
app.get('/check-session', (req, res) => {
    if(req.session.user) {
        res.json({loggedIn: true, user: req.session.user})
    }else{
        res.json({loggedIn: false})
    }
})

// Login endpoint
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const cmd = 'SELECT * FROM credentials WHERE username = $1';
        const values = [username];

        // Query database for user
        const result = await pool.query(cmd, values);

        // If user not found
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'username or password is incorrect' });
        }

        const data = result.rows[0];
        const hash = data.hashpassword;
        const fLetter = data.f_letter

        // Validate password and send the first letter of username
        const validate = bcrypt.compareSync(password, hash);
        if (!validate) {
            return res.status(404).json({ error: 'username or password is incorrect' });
        }

        //store session for 2 months
        req.session.user = {
            username: data.username,
            email: data.email,
            fLetter: fLetter
        }

        res.status(200).json({letter: fLetter, message: 'Login successful'})

        // Could optionally return success message or token here
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An issue occurred during login' });
    }
});

// Sign-up endpoint
app.post('/signUp', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS);
        const hash = bcrypt.hashSync(password, saltRounds);
        // Extract first letter from username (must be alphabetic)
        let fLetter;
        const Alphabets = /[a-zA-Z]/

        for(let i = 0; i < username.length; i++){
            if(Alphabets.test(username[i])){
                fLetter = username[i].toUpperCase()
                break
            }
        }

        // Insert new user; ignore if username already exists
        const cmd = 'INSERT INTO credentials (username,f_letter, email, hashpassword) VALUES ($1, $2, $3, $4) ON CONFLICT(username) DO NOTHING RETURNING *;';
        const values = [username, fLetter, email, hash];
        const result = await pool.query(cmd, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'username already exists' });
        };

        const newUser = result.rows[0];

        //Store session for 2 months as soon as user signs up
        req.session.user = {
            username: newUser.username,
            email: newUser.email,
            fLetter: newUser.f_letter
        }

        res.status(200).json({ message: 'User signed up successfully',letter: fLetter });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An issue occurred during sign up' });
    }
});

// Google auth routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, set session
    req.session.user = {
      username: req.user.username,
      email: req.user.email,
      fLetter: req.user.f_letter
    };
    res.redirect('https://ai-platform-three-phi.vercel.app/home');
  });

// Logout endpoint
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: 'Session destroy failed' });
      res.json({ loggedIn: false });
    });
  });
});

// Summarize endpoint
app.post('/summarize',isAuthenticated, async (req, res) => {
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

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
