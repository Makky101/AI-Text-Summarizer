import { useState } from 'react'
import { useNavigate } from "react-router-dom";
import './auth.css'
const Auth = () => {
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [isLogin, setIsLogin] = useState(false)
    const [newUser, setNewUser] = useState(true)
    const [warning, setWarning] = useState(false)
    const [errMsg, setErrMsg] = useState('')
    let navigate = useNavigate()

    async function handleAuth(){
        if(newUser){
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
                if (result.error){
                    return(result.error)
                }
            } catch (err) {
                console.log(err.message)
            }
    
        }else{
            try {
                const response = await fetch('http://localhost:3000/login', {
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
                if (result.error) {
                    return (result.error)
                }
            } catch (err) {
                console.log(err.message)
            }
        }
        return null
       
    }
    async function proceed(){
        if (!username || !password) return setWarning(!warning);
        const message = await handleAuth()
        if(message) return setErrMsg(message)

        navigate("/")
    }

    function handleGoogleAuth(){
        return
    }


    return <div className="auth-container">
        <div className="auth-box">
            <h2>{isLogin ? "Login" : "Sign Up"}</h2>

            <form onSubmit={(e) => {e.preventDefault()}}>
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
                {warning && (<div>
                    <p className='warning'>please enter username and password</p>
                </div>)}
                
                {errMsg && (<div>
                    <p className='warning'>{errMsg}</p>
                </div>)
                }
        
                {/* Submit Button */}
                <button className='signup' onClick={proceed} type="submit">
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
                <span onClick={() => {
                    setIsLogin(!isLogin),
                    setNewUser(!newUser)
                }}>
                    {isLogin ? "Sign Up" : "Login"}
                </span>
            </p>
        </div>
    </div>
}
export default Auth
