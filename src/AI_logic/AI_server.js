// Load environment variables
import 'dotenv/config';

// Express
import express from 'express';

// PostgreSQL
import pkg from 'pg';
const { Pool } = pkg;

// Auth / security
import bcrypt from 'bcrypt';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';

// AI clients
import { CohereClientV2 } from 'cohere-ai';
import { InferenceClient } from '@huggingface/inference';

// App init
const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 60,
      httpOnly: true,
      secure: false,
      sameSite: 'lax'
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

let Authorize = false;

// PostgreSQL pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.HOST,
  database: process.env.DB,
  password: process.env.PASSWORD,
  port: Number(process.env.PORT) || 5432,
  ssl: { rejectUnauthorized: false }
});

// Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/google/callback',
      passReqToCallback: true
    },
    async (request, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const displayName = profile.displayName;
        const firstLetter = displayName ? displayName.charAt(0).toUpperCase() : 'U';

        const result = await pool.query(
          'SELECT * FROM credentials WHERE email = $1',
          [email]
        );

        let user;
        if (result.rows.length === 0) {
          const insert = await pool.query(
            'INSERT INTO credentials (username, f_letter, email, hashpassword) VALUES ($1,$2,$3,$4) RETURNING *',
            ['N/A', firstLetter, email, 'N/A']
          );
          user = insert.rows[0];
        } else {
          user = result.rows[0];
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query(
      'SELECT * FROM credentials WHERE id = $1',
      [id]
    );
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

// AI clients
const co = new CohereClientV2({ token: process.env.CO_API_KEY });
const client = new InferenceClient(process.env.HF_TOKEN);

// Helpers
const instruction = (text, main) => {
  if (!main) return text;

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

Text:
${text}
`;
};

function isAuthenticated(req, res, next) {
  if (!Authorize) {
    if (req.session.user) {
      Authorize = true;
      next();
    } else {
      res.status(401).json({ loggedIn: false });
    }
  } else {
    next();
  }
}

async function summarizeUsingCohere(text) {
  const response = await co.chat({
    model: 'command-a-03-2025',
    messages: [{ role: 'user', content: instruction(text, true) }]
  });
  return response.message.content[0].text;
}

async function summarizeUsingDistilbart(text) {
  const output = await client.summarization({
    model: 'sshleifer/distilbart-cnn-12-6',
    inputs: instruction(text, false),
    provider: 'hf-inference'
  });
  return output.summary_text;
}

// Routes
app.get('/check-session', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query(
      'SELECT * FROM credentials WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'username or password is incorrect' });
    }

    const user = result.rows[0];
    const valid = bcrypt.compareSync(password, user.hashpassword);

    if (!valid) {
      return res.status(404).json({ error: 'username or password is incorrect' });
    }

    req.session.user = {
      username: user.username,
      email: user.email,
      fLetter: user.f_letter
    };

    res.json({ letter: user.f_letter, message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/summarize', isAuthenticated, async (req, res) => {
  const text = req.body.text;

  if (text === 'whoami') {
    return res.json({ summary: 'I am Markie, an AI model trained by Makky.' });
  }

  try {
    const summary = await summarizeUsingCohere(text);
    res.json({ summary });
  } catch (err) {
    try {
      const fallback = await summarizeUsingDistilbart(text);
      res.json({ summary: fallback });
    } catch {
      res.status(500).json({ error: 'Summarization failed' });
    }
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


