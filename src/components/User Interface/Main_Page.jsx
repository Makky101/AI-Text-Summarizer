import { useState, useEffect } from "react";
import './UI.css'
import User from './profile'
import Input from "./input_box";
import Output from "./output_box";
// import "./resp.css";
import { nameQuestions } from "../names";  // List of keywords for special inputs
import { useNavigate } from "react-router-dom";

//REMEBER TO SET THE PROFILE TO THE FIRST LETTER OF THE PERSON'S NAME
//IMPORT IT INTO THE USERS INTERFACE

// Main UI component for text summarization
const Main_Page = ({theme, setTheme, registered, fLetter}) => {
    // State variables
    const [input, setInput] = useState("");                  // Stores user input
    const [summary, setSummary] = useState("");             // Full summary returned by AI
    const [displayedSummary, setDisplayedSummary] = useState(""); // For typing animation
    const [expanded, setExpanded] = useState(false);        // Controls output box visibility
    const [shift, move] = useState(false);                 // Controls input box animation
    const [loading,isLoading] = useState(false)
    // Count words in the input
    const wordCount = input ? input.trim().split(/\s+/).length : 0;

    let navigate = useNavigate()  // React Router navigation

    // Function to handle text summarization requests
    async function Ask_AI(e) {
        e.preventDefault()

        // Special "whoami" command that triggers a fun AI response
        const joke = 'whoami';

        // Check if input contains keywords that should trigger the special command
        const checkWord = nameQuestions.some(s => input.toLowerCase().includes(s));

        // Early validation: ignore empty input or purely numeric input
        if (!input.trim() || !isNaN(input)) return;

        let text = input.trim()

        // Minimum word count validation (20 words) unless special command detected
        if (wordCount < 20) {
            if (checkWord) {
                // Use special command for keyword-based inputs
                text = joke;
            } else {
                // Show UI feedback for insufficient text length
                move(true); // Trigger input box animation
                setSummary("Please enter a reasonable amount of text to summarize");
                return;
            }
        }

        move(true) // Trigger shift animation
        isLoading(true) //Loading animation

        // Send POST request to backend summarization endpoint
        const response = await fetch('https://ai-text-summarizer-9lix.onrender.com/summarize', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text }),
        });

        const result = await response.json()

        if (result.loggedIn === false) {
            // Redirect to login if session expired
            return navigate('/');
        }

        isLoading(false) //Loading animation

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

        const interval = setInterval(() => {
            setDisplayedSummary(summary.slice(0, i)); // Add one character at a time
            i++;
            if (i > summary.length) clearInterval(interval); // Stop when done
        }, 18);

        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, [summary]);

    // Toggle dark/light mode by modifying body class
    useEffect(() => {
        if(theme === 'light'){
            document.body.classList.remove("dark")
        }
    }, [theme])
    return (
        <div className={`min-h-screen w-full transition-colors duration-300 overflow-x-hidden ${theme === 'dark' ? 'dark bg-black text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
             {/* Fixed header with backdrop blur effect */}
            <header className="w-full fixed top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-20 h-17">
                <div className="max-w-5xl mx-auto flex items-center justify-between py-3 px-4 sm:px-6 lg:px-8">
                    {/* App branding and tagline */}
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-bold tracking-tight">Summarizer</span>
                        <span className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400 font-medium">AI summaries, simplified</span>
                    </div>

                    {/* User controls: profile/login and theme toggle */}
                    <div className="flex items-center gap-3">
                        {/* Show user profile and logout if logged in, otherwise show login button */}
                        {registered ? (
                            <div className="flex items-center gap-2">
                                <User letter={fLetter}/>
                                <button
                                    className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    onClick={async () => {
                                        try {
                                            await fetch('https://ai-text-summarizer-9lix.onrender.com/logout', {
                                                method: 'GET',
                                                credentials: 'include'
                                            });
                                            navigate('/');
                                            window.location.reload(); // To reset state
                                        } catch (err) {
                                            console.error('Logout failed:', err);
                                        }
                                    }}
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <button
                                className="px-4 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white login-btn dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                onClick={() => navigate('/')}
                            >
                                Login
                            </button>
                        )}

                        {/* Theme toggle button with moon/sun icon */}
                        <button aria-label="Toggle theme" className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => {
                            // Toggle between light and dark themes, persist to localStorage
                            let color = theme === 'light' ? 'dark' : 'light'
                            localStorage.setItem('color',color)
                            setTheme(theme === 'light' ? 'dark' : 'light')
                        }}>
                            <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main page heading and subtitle */}
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 mt-20">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight mb-3">Analyze your text in real time</h2>
                <h3 className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3">Turn research papers, textbooks, and documents into clear summaries instantly with AI-powered intelligence</h3>
            </div>
            <div className="flex flex-col lg:flex-row justify-center gap-6 p-4 sm:p-6 min-h-[60vh] h-auto max-w-80xl mx-auto">
               <Input shift={shift} input={input} setInput={setInput}/>
                <Output expanded={expanded} displayedSummary={displayedSummary} loading={loading}/>
            </div>

            {/* WORD COUNT DISPLAY */}
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 text-center">
                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{wordCount} words</span>
            </div>
            
            {/* BUTTONS */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-8 mt-4 w-full pb-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Submit button for AI summarization */}
                <button aria-label="Enter" className="px-4 py-2 rounded-xl border-none cursor-pointer bg-blue-600 dark:bg-blue-600 hover:bg-blue-500 text-white text-lg w-full sm:w-auto transition-transform duration-300 hover:scale-110 flex items-center justify-center gap-2 shadow-sm" onClick={Ask_AI}>
                    <i className="fa-solid fa-arrow-right-to-bracket" />
                    <span className="hidden sm:inline">Enter</span>
                </button>

                {/* Clear input button */}
                <button aria-label="Clear" className="px-4 py-2 rounded-xl border-none cursor-pointer bg-red-600 dark:bg-red-600 hover:bg-red-500 text-white text-lg w-full sm:w-auto transition-transform duration-300 hover:scale-110 flex items-center justify-center gap-2 shadow-sm" onClick={remove}>
                    <i className="fa-solid fa-trash" />
                    <span className="hidden sm:inline">Clear</span>
                </button>
            </div>
        </div>
    );
}

export default Main_Page;
