import { useState } from "react"
import api from "../api"
import { useNavigate, Link } from "react-router-dom"
import "../styles/Auth.css"

function Register(){
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault()

        try {
            const res = await api.post("api/user/register/", {username, password})
            navigate('/login')
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
                    <h1 className="auth-title">Welcome to Budgy!</h1>
                    <p className="auth-subtitle">Your budgeting buddy for smarter spending</p>
                    <p className="auth-description">
                        Take control of your finances with personalized pockets, 
                        smart budgeting tools, and real-time tracking. 
                        Start your journey to financial freedom today! 🚀
                    </p>
                    <div className="auth-features">
                        <div className="feature-item">
                            <span className="feature-icon">✓</span>
                            <span>Organize expenses into custom pockets</span>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon">✓</span>
                            <span>Set recurring budgets automatically</span>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon">✓</span>
                            <span>Track your spending history</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="auth-right">
                <div className="auth-form-wrapper">
                    <h2 className="form-title">Create Your Account</h2>                    
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Choose a username"
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
                                placeholder="Create a secure password"
                                required
                            />
                        </div>
                        
                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="auth-switch">
                        <p>Already have an account?</p>
                        <Link to="/login" className="switch-link">Log In</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register