import { useState, useEffect } from "react";
import "./UI.css";
// import "./resp.css";
import { nameQuestions } from "../names";  // List of keywords for special inputs
import { useNavigate } from "react-router-dom";

//get the boolean value of the background color
const backgroundColour = localStorage.getItem("color") || 'light'

// Main UI component for text summarization
const UI = () => {
    // State variables
    const [input, setInput] = useState("");                  // Stores user input
    const [summary, setSummary] = useState("");             // Full summary returned by AI
    const [displayedSummary, setDisplayedSummary] = useState(""); // For typing animation
    const [expanded, setExpanded] = useState(false);        // Controls output box visibility
    const [theme, setTheme] = useState(backgroundColour);              // Light/dark theme toggle
    const [shift, move] = useState(false);                 // Controls input box animation
    const [loading,isLoading] = useState(false)
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

        move(true) // Trigger shift animation
        isLoading(true) //Loading animation

        // Send POST request to backend summarization endpoint
        const response = await fetch('http://localhost:3000/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text }),
        })

        const result = await response.json()

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
        } else {
            document.body.classList.add("dark")
        }
    }, [theme])
    return (
        <div className={`min-h-screen w-full transition-colors duration-300 ${theme === 'dark' ? 'dark bg-[#111] text-gray-100' : 'bg-[#F9FAFB] text-gray-900'}`}>
            {/* Header */}
            <header className="w-full fixed top-0 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-gray-800 z-20 h-16">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between h-full px-4 sm:px-6">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center shadow-sm">
                            <i className="fa-solid fa-layer-group text-white text-sm"></i>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded-md transition-colors">
                            <span>Untitled summary-1</span>
                            <i className="fa-solid fa-chevron-down text-xs text-gray-400"></i>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => {
                                let color = theme === 'light' ? 'dark' : 'light'
                                localStorage.setItem('color',color)
                                setTheme(color)
                            }}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
                        </button>
                         <button 
                            className="ml-2 px-4 py-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
                            onClick={() => navigate('/')}
                        >
                            Login
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-24 pb-10 px-4 sm:px-6 max-w-[1600px] mx-auto h-[calc(100vh-6rem)]">
                <div className={`flex flex-col lg:flex-row gap-6 h-full transition-all duration-500 ease-out
                    ${shift ? "justify-between" : "justify-center"}
                `}>
                    {/* Source Panel */}
                    <div className={`flex flex-col bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-all duration-500
                        ${shift ? "w-full lg:w-1/2" : "w-full max-w-3xl mx-auto h-[600px]"}
                    `}>
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-[#111]">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Source</h2>
                            {input && (
                                <button onClick={remove} className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                    Clear
                                </button>
                            )}
                        </div>
                        
                        <div className="flex-1 p-5 relative bg-white dark:bg-[#111]">
                            <textarea
                                className="w-full h-full resize-none bg-transparent border-none outline-none text-base text-gray-800 dark:text-gray-200 placeholder-gray-400 leading-relaxed"
                                placeholder="Paste your text here or start typing..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                        </div>

                        {/* Bottom Input Bar Simulation */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a]/50">
                            <div className="w-full bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-500 dark:text-gray-400 shadow-sm flex justify-between items-center">
                                <span>{wordCount} words</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-400 hidden sm:inline">Press Enter to summarize</span>
                                    <button 
                                        onClick={Ask_AI}
                                        className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!input.trim()}
                                    >
                                        <i className="fa-solid fa-arrow-right"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Panel */}
                    {expanded && (
                        <div className={`flex flex-col bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden w-full lg:w-1/2 animate-fade-in-up`}>
                            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-[#111]">
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Summary</h2>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(summary)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <i className="fa-regular fa-copy"></i>
                                        <span>Copy</span>
                                    </button>
                                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-medium hover:opacity-90 transition-opacity shadow-sm">
                                        <i className="fa-solid fa-download"></i>
                                        <span>Download</span>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50 dark:bg-[#1a1a1a]/30">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
                                        <div className="w-8 h-8 border-2 border-gray-300 border-t-black dark:border-gray-700 dark:border-t-white rounded-full animate-spin"></div>
                                        <span className="text-sm">Generating summary...</span>
                                    </div>
                                ) : (
                                    <div className="prose dark:prose-invert max-w-none">
                                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                                            {displayedSummary}
                                        </p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 text-center bg-white dark:bg-[#111]">
                                AI generated content may be inaccurate.
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default UI;
