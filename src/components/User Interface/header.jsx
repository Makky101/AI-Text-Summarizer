import { useNavigate } from "react-router-dom";
import User from './profile'

/**
 * Header component - Fixed navigation bar with branding, user controls, and theme toggle
 * @param {string} fLetter - First letter of username for user avatar
 * @param {function} setTheme - Function to update theme state
 * @param {string} theme - Current theme ('light' or 'dark')
 * @param {boolean} registered - Whether user is logged in
 */
function Heading({fLetter, setTheme, theme, registered}){
    let navigate = useNavigate()  // React Router navigation hook

    return(
        <>
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
                                            await fetch('https://ai-text-summarizer-7hlq.onrender.com/logout', {
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
        </>
    )
}

export default Heading
