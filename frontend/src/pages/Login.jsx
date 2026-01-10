import { useState } from "react"
import api from "../api"
import { useNavigate, Link } from "react-router-dom"
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants"
import "../styles/Auth.css"

function Login(){
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault()

        try {
            const res = await api.post('api/token/', {username, password})
            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh)
            navigate("/")
        } catch (error){
            alert(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-left">
                <div className="auth-content">
                    <h1 className="auth-logo">💰 Budgy</h1>
                    <h2 className="auth-title">Welcome Back!</h2>
                    <p className="auth-subtitle">Ready to master your money?</p>
                    <p className="auth-description">
                        Your pockets are waiting! Log in to continue managing 
                        your finances like a pro. Smart budgeting is just one 
                        click away. 💚
                    </p>
                </div>
            </div>

            <div className="auth-right">
                <div className="auth-form-wrapper">
                    <h2 className="form-title">Log In</h2>
                    <p className="form-subtitle">Continue your budgeting journey</p>
                    
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                        
                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? 'Logging In...' : 'Log In'}
                        </button>
                    </form>

                    <div className="auth-switch">
                        <p>Don't have an account?</p>
                        <Link to="/register" className="switch-link">Sign Up</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login