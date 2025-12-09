import { useState, useEffect } from "react";
import "./UI.css";
import "./resp.css";
import { nameQuestions } from "../names";
import { useNavigate } from "react-router-dom";

const UI = () => {
    const [input, setInput] = useState("");
    const [summary, setSummary] = useState("");
    const [displayedSummary, setDisplayedSummary] = useState("");
    const [expanded, setExpanded] = useState(false);
    const [theme, setTheme] = useState(true);
    const [shift, move] = useState(false)

    const wordCount = input ? input.trim().split(/\s+/).length : 0;

    let navigate = useNavigate()

    async function Ask_AI(e) {
        e.preventDefault()

        const joke = 'whoami'
        const checkWord = nameQuestions.some(s => input.toLowerCase().includes(s));

        if (!input.trim() || !isNaN(input)) return;

        let text = input.trim()

        if (wordCount < 20) {
            if (checkWord) {
                text = joke;
            } else {
                setSummary("Please enter a reasonable amount of text to summarize");
                move(true);
                return;
            }
        }

        const response = await fetch('http://localhost:3000/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text}),
        })

        const result = await response.json()

        if (result.error) {
            setSummary(result.error)
        } else {
            setSummary(result.summary)
        };

        setDisplayedSummary("");
      

    }

    useEffect(() => {
        if(shift){
            setExpanded(true)
        }
    },[shift])

    const remove = () => input && setInput('')


    // Typing animation for summary
    useEffect(() => {
        let i = 0;
        if (!summary) return;

        move(true)

        const interval = setInterval(() => {
            setDisplayedSummary(summary.slice(0, i));
            i ++;
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
               
                {/* Login/Sign Up Buttons */}
                <div className="header-actions">
                    <button className="login-btn" onClick={() => navigate('/signUp')}>Login</button>
                    {/* Theme toggle */}
                    <i className="fa-solid theme-btn fa-circle-half-stroke"
                        onClick={() => setTheme(theme ? false : true)}>
                    </i>
                </div>
            </header>
            {/* MAIN HEADINGS */}
            <h2>Analyze your text in real time</h2>
            <h3>Turn research papers, textbooks, and documents into clear summaries instantly with AI-powered Intelligence</h3>

            <div className="container">
                {/* INPUT BOX */}
                <div className={`input-box ${shift ? "move" : ""}`}>
                    <textarea
                        className={`${theme ? 'dark-theme' : ''}`}
                        placeholder="Start typing here…"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />

                    {/* BUTTONS */}
                    <div className="btn-layout">
                        <button className="summ-btn" onClick={Ask_AI}>
                            <i class="fa-solid fa-arrow-right-to-bracket"></i>
                        </button>
                        <button className="clear-btn" onClick={remove}>
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>

                    {/* WORD COUNT */}
                    <div className={`word-count ${theme ? 'dark-theme' : 'light-theme'}`}>
                        {wordCount} words
                    </div>
                </div>

                {/* OUTPUT BOX */}
                {expanded && (
                    <div className={`output-box ${expanded ? "visible" : ""}`}>
                        <pre>{displayedSummary}</pre>
                    </div>
                )}
            </div>
        </>
    );
}

export default UI;
