import { useState } from 'react'
import './auth.css'
const Auth = () => {
//after my pre-cas interview
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [isLogin, setIsLogin] = useState(false)

    function handleAuth(){
        return
    }

    function handleGoogleAuth(){
        return
    }


    return <div className="auth-container">
        {/* LOGIN / SIGN UP FORM */}
        <div className="auth-box">
            <h2>{isLogin ? "Login" : "Sign Up"}</h2>

            <form onSubmit={handleAuth}>
                {/* Username */}
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />

                {/* Password */}
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                {/* Submit Button */}
                <button type="submit">{isLogin ? "Login" : "Sign Up"}</button>
            </form>

            {/* Google Auth */}
            <div className="google-btn" >
                <button onClick={handleGoogleAuth}>
                    Continue with Google
                </button>
            </div>
            

            {/* Toggle between Login and Sign Up */}
            <p className="toggle-text">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <span onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? "Sign Up" : "Login"}
                </span>
            </p>
        </div>
    </div>
  
}

export default Auth
