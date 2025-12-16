// Load environment variables from .env
import 'dotenv/config';

// Express framework imports
import express from 'express';
import type { Request, Response } from 'express';

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
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));  // Enable CORS with credentials
app.use(express.json());  // Parse JSON request bodies
app.use(
    session({
        secret: String(process.env.SESSION_SECRET),
        resave: false,
        saveUninitialized: false,
        cookie:{
            maxAge: 1000 * 60 * 60 * 24 * 60,
            httpOnly: true,  // Security: prevent client-side access
            secure: false,    // Set to true in production with HTTPS
            sameSite: 'lax'
        }
    })
);
app.use(passport.initialize())
app.use(passport.session())

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback: true
},
async (request: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
        const email = profile.emails[0].value;
        const displayName = profile.displayName;
        const firstLetter = displayName ? displayName.charAt(0).toUpperCase() : 'U';

        // Check if user exists
        const cmd = 'SELECT * FROM credentials WHERE email = $1';
        const result = await pool.query(cmd, [email]);

        const NA = 'N/A'
        let user;
        if (result.rows.length === 0) {
            // Create new user
            const insertCmd = 'INSERT INTO credentials (username, f_letter, email, hashpassword) VALUES ($1, $2, $3, $4) RETURNING *';
            const insertResult = await pool.query(insertCmd, [NA, firstLetter, email, NA]);
            user = insertResult.rows[0];
        } else {
            user = result.rows[0];
        }

        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((user: any, done : any) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: number, done :any) => {
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
    port: Number(process.env.PORT),
});

// Port the server will listen on
const port: Number = 3000;

// Initialize AI clients
const co = new CohereClientV2({ token: process.env.CO_API_KEY });
const client = new InferenceClient(process.env.HF_TOKEN);

// Instruction generator for AI summarization
const instruction = (text: string, main: boolean) => {
    if (main) {
        // Returns a formatted instruction for summarization
        return `
        You are an intelligent summarizer for educational material (research papers, textbooks, or student notes).
        Produce a **short, clear, simple, user-friendly summary** in **plain text** that will render well in a browser.

        Requirements:
        1. Explain the material in **simple language**, as if teaching a student, avoiding complex terms unless necessary.
        2. Keep the summary **short and concise**, focusing only on the most important facts, dates, achievements, and concepts.
        3. Start with a **brief paragraph** summarizing the main ideas in an easy-to-understand way.
        4. Add **key points below the paragraph**, each on a **new line** with a simple bullet or dash, but keep them minimal.
        5. Use **natural spacing, line breaks, and indentation** for readability on a web page.
        6. Do **not** include labels like "Document Type", "Summary", headings, mindmaps, or Markdown syntax.

        Use your own style for spacing and formatting so it looks clean and readable in a browser.

        Here is the text to summarize:
        ${text}
`;
    } else {
        return text;
    }
};

// Middleware to check if user is authenticated via session
// Redirects to login page if not authenticated
function isAuthenticated(req:Request, res:Response, next:any){
    if((req.session as any).user){
        next(); //user is logged in
    } else{
        res.status(401).json({ loggedIn: false });
    }
}

// Summarize text using Cohere AI
async function summarizeUsingCohere(text: string) {
    const response: any = await co.chat({
        model: 'command-a-03-2025',
        messages: [{ role: 'user', content: instruction(text, true) }],
    });
    return response.message.content[0].text;
}

// Summarize text using DistilBART (fallback)
async function summarizeUsingDistilbart(text: string) {
    const output = await client.summarization({
        model: 'sshleifer/distilbart-cnn-12-6',
        inputs: instruction(text, false),
        provider: 'hf-inference',
    });
    return output.summary_text;
}

// Endpoint to check if user session is active
app.get('/check-session', (req:Request, res: Response) => {
    if((req.session as any).user) {
        res.json({loggedIn: true, user: (req.session as any).user})
    }else{
        res.json({loggedIn: false})
    }
})

// Login endpoint
app.post('/login', async (req: Request, res: Response) => {
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
        (req.session as any).user = {
            username: data.username,
            email: data.email,
            fLetter: fLetter
        }

        res.status(200).json({letter: fLetter, message: 'Login successful'})

        // Could optionally return success message or token here
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'An issue occurred during login' });
    }
});

// Sign-up endpoint
app.post('/signUp', async (req: Request, res: Response) => {
    try {
        const { username, password, email } = req.body;
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS!);
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
        (req.session as any).user = {
            username: newUser.username,
            email: newUser.email,
            fLetter: newUser.f_letter
        }

        res.status(200).json({ message: 'User signed up successfully',letter: fLetter });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'An issue occurred during sign up' });
    }
});

// Google auth routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req: Request, res: Response) => {
    // Successful authentication, set session
    (req.session as any).user = {
      username: ((req as any).user as any).username,
      email: ((req as any).user as any).email,
      fLetter: ((req as any).user as any).f_letter
    };
    res.redirect('http://localhost:5173/home');
  });

// Logout endpoint
app.get('/logout', (req: Request, res: Response) => {
  (req as any).logout((err: any) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: 'Session destroy failed' });
      res.json({ loggedIn: false });
    });
  });
});

// Summarize endpoint
app.post('/summarize',isAuthenticated, async (req: Request, res: Response) => {
    const text = req.body.text;
    // This is a joke!
    if (text === 'whoami') {
        return res.json({ summary: 'I am Markie, an AI model trained by Makky.' });
    }

    try {
        const feedBack = await summarizeUsingCohere(text);
        res.json({ summary: feedBack });
    } catch (err: any) {
        console.error(err.statusCode, err.body?.message || err.message);

        // Fallback to DistilBART for errors like 404, 429, 500
        if ([404, 429, 500].includes(err.statusCode)) {
            console.log('Switching to Distilbart');
            try {
                const feedBack = await summarizeUsingDistilbart(text);
                return res.json({ summary: feedBack });
            } catch (fallbackErr: any) {
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
