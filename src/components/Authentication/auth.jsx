import { useState } from 'react'
import { useNavigate } from "react-router-dom";
import './auth.css'
const Auth = () => {
//after my pre-cas interview
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [isLogin, setIsLogin] = useState(false)
    const [newUser, setNewUser] = useState(false)
    let navigate = useNavigate()

    async function handleAuth(){
        try {
            const response = await fetch('http://localhost:3000/signUp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username.trim(),
                    password: password.trim(),
                })
            })
            const result = await response.json()
            console.log(result.message)
        } catch (err) {
            console.log(err.message)
        }

    }

    function handleGoogleAuth(){
        return
    }


    return <div className="auth-container">
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
                <button className='signup' onClick={() => navigate('/')} type="submit">
                    {isLogin ? "Login" : "Sign Up"}
                </button>

            </form>

            {/* Google Auth */}
            <div className="google-btn" >
                <button onClick={handleGoogleAuth}>
                    Continue with Google
                </button>
            </div>
            

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
