import { useState } from 'react'
import { useNavigate } from "react-router-dom";
// import './auth.css'

// Auth component handles Login and Sign Up
const Auth = () => {
    // State variables for form inputs and UI state
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [isLogin, setIsLogin] = useState(false)   // Toggles Login / Sign Up UI
    const [newUser, setNewUser] = useState(true)    // Determines which endpoint to call
    const [warning, setWarning] = useState(false)   // Show warning if fields empty
    const [errMsg, setErrMsg] = useState('')        // Store error messages from server
    const [register, setRegister] = useState(false)
    let navigate = useNavigate()                    // React Router navigation hook

    // Function to handle Login or Sign Up requests
    async function handleAuth() {
        if (newUser) {
            // Sign Up flow
            try {
                const response = await fetch('http://localhost:3000/signUp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: username.trim(),
                        password: password.trim(),
                    })
                })
                const result = await response.json()
                if (result.error) {
                    // Return error message if sign up fails
                    return (result.error)
                }
            } catch (err) {
                console.log(err.message) // Log network / fetch errors
            }

        } else {
            // Login flow
            try {
                const response = await fetch('http://localhost:3000/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: username.trim(),
                        password: password.trim(),
                    })
                })
                const result = await response.json()
                if (result.error) {
                    // Return error message if login fails
                    return (result.error)
                }
            } catch (err) {
                console.log(err.message) // Log network / fetch errors
            }
        }
        return null // No error
    }

    // Function triggered when user clicks Login / Sign Up button
    async function proceed() {
        // Show warning if username or password is empty
        if (!username || !password) return setWarning(!warning);

        const message = await handleAuth()
        if (message) return setErrMsg(message) // Show server error if exists

        // Navigate to home page on successful login / signup
        navigate("/home")

        //account registered

    }

    // Placeholder function for Google authentication
    function handleGoogleAuth() {
        return
    }

    return <div className="flex justify-center items-center min-h-screen p-6 bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <div className="w-full max-w-[400px] bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 p-6 sm:p-8 rounded-xl shadow-lg dark:shadow-none text-center transition-colors duration-300">
            {/* Title changes based on login/signup mode */}
            <h2 className="mb-6 text-2xl font-bold tracking-tight">{isLogin ? "Login" : "Sign Up"}</h2>

            <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault() }}>
                {/* Username input */}
                <input
                    className="p-3 text-base rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20 transition-all"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />

                {/* Password input */}
                <input
                    className="p-3 text-base rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20 transition-all"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                {/* Warning for empty fields */}
                {warning && (
                    <div>
                        <p className='text-red-500 text-sm'>please enter username and password</p>
                    </div>
                )}

                {/* Server error message */}
                {errMsg && (
                    <div>
                        <p className='text-red-500 text-sm'>{errMsg}</p>
                    </div>
                )}

                {/* Submit button */}
                <button 
                    className='p-3 text-base rounded-lg border-none cursor-pointer bg-blue-600 dark:bg-blue-600 hover:bg-blue-500 text-white font-medium transition-transform duration-200 hover:scale-105 shadow-sm' 
                    onClick={proceed} 
                    type="submit"
                >
                    {isLogin ? "Login" : "Sign Up"}
                </button>

            </form>

            {/* Google Authentication button */}
            <div className="mt-4 flex items-center justify-center">
                <button 
                    className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 shadow-sm"
                    onClick={handleGoogleAuth}
                >
                    <i className="fa-brands fa-google text-red-500"></i>
                    Continue with Google
                </button>
            </div>

            {/* Toggle between Login and Sign Up */}
            <p className="mt-4 text-sm text-gray-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <span 
                    className="text-blue-500 cursor-pointer font-medium hover:underline"
                    onClick={() => {
                        setIsLogin(!isLogin)
                        setNewUser(!newUser)
                    }}
                >
                    {isLogin ? "Sign Up" : "Login"}
                </span>
            </p>
        </div>
    </div>
}

export default Auth
