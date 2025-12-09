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

// AI clients
import { CohereClientV2 } from 'cohere-ai';
import { InferenceClient } from '@huggingface/inference';

// Initialize Express app
const app = express();
app.use(cors());          // Enable CORS
app.use(express.json());  // Parse JSON request bodies

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
        Produce a **short, clear, simple, student-friendly summary** in **plain text** that will render well in a browser.

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

// Login endpoint
app.post('/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        const cmd = 'SELECT * FROM cred WHERE username = $1';
        const values = [username];

        // Query database for user
        const result = await pool.query(cmd, values);

        // If user not found
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'username or password is incorrect' });
        }

        const data = result.rows[0];
        const hash = data.hashpassword;

        // Validate password
        const validate = bcrypt.compareSync(password, hash);
        if (!validate) {
            return res.status(404).json({ error: 'username or password is incorrect' });
        }

        // Could optionally return success message or token here
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'An issue occurred during login' });
    }
});

// Sign-up endpoint
app.post('/signUp', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS!);
        const hash = bcrypt.hashSync(password, saltRounds);

        // Insert new user; ignore if username already exists
        const cmd = 'INSERT INTO cred (username, hashPassword) VALUES ($1, $2) ON CONFLICT(username) DO NOTHING RETURNING *;';
        const values = [username, hash];
        const result = await pool.query(cmd, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'username already exists' });
        }

        res.status(200).json({ message: 'User signed up successfully' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'An issue occurred during sign up' });
    }
});

// Summarize endpoint
app.post('/summarize', async (req: Request, res: Response) => {
    const text = req.body.text;

    // Special command for testing
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
