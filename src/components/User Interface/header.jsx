import { useNavigate } from "react-router-dom";
import User from './profile'

function Heading({fLetter, setTheme, theme, registered}){
    let navigate = useNavigate()  // React Router navigation
    return(
        <>
            <header className="w-full fixed top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-20 h-17">
                {/*texts at headings*/}
                <div className="max-w-5xl mx-auto flex items-center justify-between py-3 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-bold tracking-tight">Summarizer</span>
                        <span className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400 font-medium">AI summaries, simplified</span>
                    </div>

                    <div className="flex items-center gap-3">
                    {registered ?
                        <User letter={fLetter}/>   
                        :
                            <button 
                                className="px-4 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white login-btn dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                onClick={() => navigate('/')}
                            >
                                Login
                            </button>
                    }

                        <button aria-label="Toggle theme" className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => {
                            let color = theme === 'light' ? 'dark' : 'light'
                            localStorage.setItem('color',color)
                            setTheme(theme === 'light' ? 'dark' : 'light')
                        }}>
                            <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
                        </button>
                    </div>
                </div>
            </header>
            
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 mt-20">{/* MAIN HEADINGS */}
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight mb-3">Analyze your text in real time</h2>
                <h3 className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3">Turn research papers, textbooks, and documents into clear summaries instantly with AI-powered intelligence</h3>
            </div>
        </>
    )
}

export default Heading