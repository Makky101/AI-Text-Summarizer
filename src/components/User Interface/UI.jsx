import { useState, useEffect } from "react";
import "./UI.css";
import "./resp.css";
import { nameQuestions } from "../names";  // List of keywords for special inputs
import { useNavigate } from "react-router-dom";

// Main UI component for text summarization
const UI = () => {
    //get the boolean value of the background color
    const backgroundColour = localStorage.getItem("color") || 'light'
    // State variables
    const [input, setInput] = useState("");                  // Stores user input
    const [summary, setSummary] = useState("");             // Full summary returned by AI
    const [displayedSummary, setDisplayedSummary] = useState(""); // For typing animation
    const [expanded, setExpanded] = useState(false);        // Controls output box visibility
    const [theme, setTheme] = useState(backgroundColour);              // Light/dark theme toggle
    const [shift, move] = useState(false);                 // Controls input box animation

    // Count words in the input
    const wordCount = input ? input.trim().split(/\s+/).length : 0;

    let navigate = useNavigate()  // React Router navigation

    // Function to handle text summarization
    async function Ask_AI(e) {
        e.preventDefault()

        const joke = 'whoami'; // Special command for AI
        const checkWord = nameQuestions.some(s => input.toLowerCase().includes(s));

        // Ignore empty input or purely numeric input
        if (!input.trim() || !isNaN(input)) return;

        let text = input.trim()

        // Require a minimum word count unless special command is detected
        if (wordCount < 20) {
            if (checkWord) {
                text = joke; // Send special "whoami" command
            } else {
                move(true); // Trigger animation for small input
                setSummary("Please enter a reasonable amount of text to summarize");
                return;
            }
        }

        // Send POST request to backend summarization endpoint
        const response = await fetch('http://localhost:3000/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text }),
        })

        const result = await response.json()

        if (result.error) {
            setSummary(result.error) // Display error if backend fails
        } else {
            setSummary(result.summary) // Display returned summary
        };

        setDisplayedSummary(""); // Reset typing animation
    }

    // Show output box when shift is true
    useEffect(() => {
        if (shift) {
            setExpanded(true)
        }
    }, [shift])

    // Function to clear input
    const remove = () => input && setInput('')

    // Typing animation effect for the AI summary
    useEffect(() => {
        let i = 0;
        if (!summary) return;

        move(true) // Trigger shift animation

        const interval = setInterval(() => {
            setDisplayedSummary(summary.slice(0, i)); // Add one character at a time
            i++;
            if (i > summary.length) clearInterval(interval); // Stop when done
        }, 18);

        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, [summary]);

    // Toggle dark/light mode by modifying body class
    useEffect(() => {
        if(theme === 'dark'){
            document.body.classList.add("dark")
        }else if(theme === 'light' && document.body.classList.contains('dark')){
            document.body.classList.remove("dark")
        }
    }, [theme])

    return (
        <>
            {/* TOP BAR */}
            <header className="header">
                {/* Login/Sign Up Buttons */}
                <div className="header-actions">
                    <button className="login-btn" onClick={() => navigate('/')}>Login</button>
                    {/* Theme toggle button */}
                    <i className="fa-solid theme-btn fa-circle-half-stroke"
                        onClick={() => {
                            //store the color of the background so upon refreshing it loads the background it was previously in.
                            let color = theme === 'light' ? 'dark' : 'light'
                            localStorage.setItem('color',color)
                            setTheme(theme === 'light' ? 'dark' : 'light')
                        }}>
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
                        className={`${theme === 'dark' ? 'light-theme' : 'dark-theme'}`} // Apply dark theme if enabled
                        placeholder="Start typing here…"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />        
                </div>

                {/* OUTPUT BOX */}
                {expanded && (
                    <div className={`output-box ${expanded ? "visible" : ""}`}>
                        <pre>{displayedSummary}</pre> {/* Typing animation summary */}
                    </div>
                )}
            </div>

            {/* WORD COUNT DISPLAY */}
            <div className={`word-count ${shift ? "move-word" : ""}`}>
                {wordCount} words
            </div>
            
            {/* BUTTONS */}
            <div className="btn-layout">
                {/* Submit button for AI summarization */}
                <button className="summ-btn" onClick={Ask_AI}>
                    <i className="fa-solid fa-arrow-right-to-bracket"></i>
                </button>

                {/* Clear input button */}
                <button className="clear-btn" onClick={remove}>
                    <i className="fa-solid fa-trash"></i>
                </button>
            </div>
        </>
    );
}

export default UI;
