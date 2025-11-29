import { useState, useEffect } from "react";
import "./style2.css";
import { nameQuestions } from "./names";

const UI2 = () => {
    const [input, setInput] = useState("");
    const [summary, setSummary] = useState("");
    const [displayedSummary, setDisplayedSummary] = useState("");
    const [expanded, setExpanded] = useState(false);
    const [theme, setTheme] = useState(true);
    const [shift, move] = useState(false)

    const wordCount = input ? input.trim().split(/\s+/).length : 0;


    async function Ask_AI(e) {
        e.preventDefault()


        const checkWord = nameQuestions.some(s => input.toLowerCase().includes(s));

        if (!input.trim() || !isNaN(input)) return;

        if (wordCount < 150) {
            if (checkWord) {
                setInput('About');
            } else {
                setDisplayedSummary("Please enter a reasonable amount of text to summarize");

                return;
            }
        }

        const response = await fetch('http://localhost:3000/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: input.trim() }),
        })

        const result = await response.json()

        if (result.error) {
            setSummary(result.error)
        } else {
            setSummary(result.summary)
        };

        setDisplayedSummary("");
        move(true);

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
        <>
            {/* TOP BAR */}
            <header className="header">

                <button
                    className="theme-btn"
                    onClick={() => setTheme(theme ? false : true)}
                >
                    {theme ? "🌙" : "☀️"}
                </button>
            </header>

            <h2 >Analyze your text in real time</h2>
            <h3>Transform long text into concise summaries instantly with AI-powered intelligence</h3>

            <div className="container">
                {/* INPUT */}
                <div className={`input-box ${shift ? "move" : ""} `}>
                    <textarea className={`${theme ? 'dark-theme' : ''}`}
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

                {expanded && <div className={`output-box ${expanded ? "visible" : ""}`}>
                    <p>{displayedSummary}</p>
                </div>}
            </div>
        </>
    );
}

export default UI2;
