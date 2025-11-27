import { useState, useEffect } from "react";
import "./style2.css";
import { nameQuestions } from "./names";

const UI2 = () => {
    const [input, setInput] = useState("");
    const [summary, setSummary] = useState("");
    const [displayedSummary, setDisplayedSummary] = useState("");
    const [expanded, setExpanded] = useState(false);
    const [theme, setTheme] = useState(true);

    const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;


    async function Ask_AI(e) {
        e.preventDefault()
        
        const checkWord = nameQuestions.some(s => input.toLowerCase().includes(s));

        if(!input.trim() || !isNaN(input)) return;

        if(wordCount < 150 ){
            if (checkWord){
                setInput('About');
            }else{
                setDisplayedSummary("Please enter a reasonable amount of text to summarize");
                setExpanded(true);
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
            setSummary(result.error)
        }else{
            setSummary(result.summary)
        };

        setDisplayedSummary("");
        setExpanded(true);
        
    }

    const remove = () => input && setInput('')

    // Typing animation for summary
    useEffect(() => {
        let i = 0;
        if (!summary) return;

        const interval = setInterval(() => {
            setDisplayedSummary(summary.slice(0, i));
            i++;
            if (i > summary.length) clearInterval(interval);
        }, 18);

        return () => clearInterval(interval);
    }, [summary]);

    //Enabling light and dark mode
    useEffect(() => {
        document.body.classList.toggle("dark")
    }, [theme])

    return (
        <div>
            {/* TOP BAR */}
            <header className="header">
                <h2>Analyze your text in real time</h2>

                <button
                    className="theme-btn"
                    onClick={() => setTheme(theme ? false : true)}
                >
                    {theme ? "🌙" : "☀️"}
                </button>
            </header>

            <div className="container">
                {/* INPUT */}
                <div className={`input-box ${expanded ? "shrink" : ""}`}>
                    <textarea className={`${theme ? 'dark-theme' : 'light-theme'}`}
                        placeholder="Start typing here…"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <div className="btn-layout">
                        <button className="summ-btn" onClick={Ask_AI}>
                            Summarize
                        </button>
                        <button className="clear-btn" onClick={remove}>
                            Clear All
                        </button>
                    </div>
                    <div className={`word-count ${theme ? 'dark-theme' : 'light-theme'}`}>{wordCount} words</div>
                </div>

        
                <div className={`output-box ${expanded ? "visible" : ""}`}>
                    <p className="typing">{displayedSummary}</p>
                </div>
            </div>
        </div>
    );
}

export default UI2;
