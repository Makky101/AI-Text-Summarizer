import { useState } from "react"
import { nameQuestions } from "./names";
const UI = () => {

    const [input, new_input] = useState("");
    const [summary, new_summary] = useState("");                  

    async function Ask_AI(e) {
        e.preventDefault()
        
        const checkWord = nameQuestions.some(s => input.toLowerCase().includes(s));

        if(!input || !isNaN(input)) return;

        if(input.length < 300 ){
            if (checkWord){
                new_input('About');
            }else{
                new_summary("Please enter a reasonable amount of text to summarize");
                return;
            }
        }

        const response = await fetch('http://localhost:3000/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({ text: input.trim() }),
        })

        const result = await response.json()
        if(result.error){
            new_summary(result.error)
        }else{
            new_summary(result.summary)
        };
    }

    


    return(
        <div className="w-full max-w-2xl bg-white p-6 rounded-xl shadow-lg border">
            <h1 className="text-2xl font-bold mb-4 text-center">Don't have all day to be reading Epistles?</h1>
            <h2 className="font-semibold mb-2">Summarize any text we got you covered 👍</h2>
                <textarea 
                    value={input} 
                    rows={6}
                    onChange={e => new_input(e.target.value)} 
                    placeholder='Paste your text here...' 
                />
            <button className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition" onClick={Ask_AI}>Summarize</button>
            <button className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition" onClick={remove}>Clear</button>
            <div className="mt-6 p-4 bg-gray-100 rounded-md border">
                {summary}
            </div>
        </div>
    )
}

export default UI