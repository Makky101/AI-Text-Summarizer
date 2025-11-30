require('dotenv').config();

const express = require('express')
const cors = require('cors')
const { CohereClientV2 } = require('cohere-ai');
const { InferenceClient } = require('@huggingface/inference')

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000

const co = new CohereClientV2({ token: process.env.CO_API_KEY });

const client = new InferenceClient(process.env.HF_TOKEN);

async function summarizeUsingCohere(text) {
    const response = await co.chat({
        model: "command-a-03-2025",
        messages: [{ role: "user", content: instruction(text, true) }]
    });

    return (response.message.content[0].text);
};

async function summarizeUsingDistilbart(text) {
    const output = await client.summarization({
        model: "sshleifer/distilbart-cnn-12-6",
        inputs: instruction(text, false),
        provider: "hf-inference"
    });
    return (output.summary_text)
};

const instruction = (text, main) => {
    let instructions;
    if (main) {
        instructions = `
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
        `
    } else {
        instructions = text
    }
    return instructions
}

app.post('/summarize', async (req, res) => {
    const text = req.body.text
    let feedBack;
    if (text === 'About') {
        return (res.json({ summary: "I am Markie, an AI model trained by Makky." }))
    }
    try {
        feedBack = await summarizeUsingCohere(text)
        res.json({ summary: feedBack })
    }
    catch (err) {
        console.error(err.statusCode, err.body?.message || err.message)
        const swap = [404, 429, 500].includes(err.statusCode)
        if (swap) {
            console.log('Switching to the Machine Learning Model')
            try {
                feedBack = await summarizeUsingDistilbart(text)
                return res.json({ summary: feedBack })
            } catch (fallbackErr) {
                console.log('Both models failed!')
                console.error(fallbackErr.body?.message || fallbackErr.message);
                return res.status(500).json({ Error: "An issue occured when summarizing text" });
            }
        }
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})

