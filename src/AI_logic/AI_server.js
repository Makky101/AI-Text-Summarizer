import 'dotenv/config';// Load environment variables from .env


// Express framework imports
import express, { request } from 'express';


// PostgreSQL client
import { Pool } from 'pg';

// Password hashing
import bcrypt from 'bcrypt';

// Enable Cross-Origin Resource Sharing
import cors from 'cors';

import session from 'express-session';

import passport from 'passport';

import { Strategy } from 'passport-local';

import {Strategy as GoogleStrategy} from 'passport-google-oauth2'

import pgSession from 'connect-pg-simple';



// AI clients
import { CohereClientV2 } from 'cohere-ai';
import { InferenceClient } from '@huggingface/inference';

// PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.HOST,
    database: process.env.DB,
    password: process.env.PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
    ssl: { rejectUnauthorized: false }
});

// Initialize Express app
const app = express();
app.use(cors({ origin: 'https://clario-alpha.vercel.app', credentials: true }));  // Enable CORS with credentials
app.use(express.json());  // Parse JSON request bodies
app.use(
    session({
      store: new (pgSession(session))({
        pool: pool,
        tableName: 'user_session',
        createTableIfMissing:true
      }),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 60, // 2 months
        httpOnly: true,
        secure: true,    // true in production
        sameSite: 'none'
      }
    })
);
  

app.use(passport.initialize())
app.use(passport.session())



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
function isAuthorized(req, res, next){
    if(req.isAuthenticated()){
        next(); //user is logged in
    } else{
        res.status(401).json({ loggedIn: false });
    }
    
}

/*
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
  }));
  
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: true }),
    (req, res) => {
        // Successful login → user is attached to session
        res.redirect('/home'); // or send JSON if frontend-only
    }
);
*/

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
    console.log(req.session.passport.user)
    if(req.isAuthenticated()){
        res.json({loggedIn: true, user: req.user})
    }else{
        res.json({loggedIn: false})
    }
})

// Login endpoint
app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {

        if (err) {
            return res.status(500).json({ error: 'Server error' });
        }

        if (!user) {
            return res.status(401).json(info);
        }

        // log user into the session
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

        const newUser = {letter: result.rows[0].f_letter};

       req.login(newUser,(err)=>{
        console.log(err)
        res.status(200).json({ message: 'User signed up successfully', letter: newUser.letter });
       })
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An issue occurred during sign up' });
    }
});

app.get('/logout', (req, res, next) => {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.json({ message: 'Logged out successfully' });
    });
});
  

// Summarize endpoint
app.post('/summarize',isAuthorized, async (req, res) => {
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
            user = {letter: insertResult.rows[0].f_letter};
        } else {
            user = {letter: result.rows[0].fLetter};
        }

        return cb(null, user);
    } catch (err) {
        return cb(err, null);
    }
}));
*/

// Login  using passport
passport.use(new Strategy(async function verify(username,password,cb){
    try {
        const cmd = 'SELECT * FROM credentials WHERE username = $1';
        const values = [username];

        // Query database for user
        const result = await pool.query(cmd, values);

        // If user not found
        if (result.rows.length === 0) {
            return cb(null, false,{ error: 'username or password is incorrect' });
        }

        const data = result.rows[0];
        const hash = data.hashpassword;
        const fLetter = data.f_letter

        // Validate password and send the first letter of username
        const validate = bcrypt.compareSync(password, hash);
        if (!validate) {
            return cb(null, false, { error: 'Username or password is incorrect' });
        }

        const user = {
            letter: fLetter
        }

        return cb(null, user)

    } catch (err) {
        return cb(err)
    }
}));

passport.serializeUser((user, cb)=>{
    cb(null,user)
})

passport.deserializeUser((user,cb)=>{
    cb(null,user)
})

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
