require('dotenv').config();

const express = require('express')
const cors = require('cors')
const {CohereClientV2} = require('cohere-ai');
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
        messages: [{ role: "user", content: instruction(text,true) }]
      });

    return (response.message.content[0].text);
};

async function summarizeUsingDistilbart(text){
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
        You are Markie, an AI assistant trained to summarize text.
        Your only task is to produce a clear, concise summary that captures the main ideas only.
        Keep summaries extremely short. Use as few words as possible without losing meaning.
        Do not repeat anything. Do not add explanation, filler, or commentary.

        Summarize this text:
        ${text}
        `
    } else {
        instructions = text
    }
    return instructions
}

app.post('/summarize',async (req, res) => {
    const text = req.body.text
    let feedBack;
    if(text === 'whoami'){
        return (res.json({ summary: "I am Markie, an AI model trained by Makky."}))
    }
    try {
        feedBack = await summarizeUsingCohere(text)
        res.json({summary: feedBack})
    }
    catch (err) {
        console.error(err.statusCode, err.body?.message || err.message)
        const swap = [404, 429, 500].includes(err.statusCode)
        if (swap){
            console.log('Switching to the Machine Learning Model')
            try{
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

    