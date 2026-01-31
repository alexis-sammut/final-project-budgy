import { useState } from "react"
import api from "../api"
import { useNavigate, Link } from "react-router-dom"
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants"
import "../styles/Auth.css"

// Registration component for new users
function Register(){
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    // Handle account creation
    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true);
        setError('');
        
        try {
            // Create user and auto-login
            const res = await api.post("api/user/register/", {username, password})
            
            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
            
            // Navigate to home page
            navigate('/')
        } catch (error) {
            if (error.response) {
                // Server responded with error
                if (error.response.status === 400) {
                    // Handle validation errors
                    const data = error.response.data;
                    
                    if (data.username) {
                        // Username already exists or validation error
                        if (Array.isArray(data.username)) {
                            setError(data.username[0]);
                        } else {
                            setError(data.username);
                        }
                    } else if (data.password) {
                        // Password validation error
                        if (Array.isArray(data.password)) {
                            setError(data.password[0]);
                        } else {
                            setError(data.password);
                        }
                    } else if (data.detail) {
                        setError(data.detail);
                    } else {
                        setError('Registration failed. Please check your input.');
                    }
                } else if (error.response.data?.detail) {
                    setError(error.response.data.detail);
                } else {
                    setError('Registration failed. Please try again.');
                }
            } else if (error.request) {
                // Request made but no response
                setError('Cannot connect to server. Please check your connection.');
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-container">
            {/* 'Marketing' content on left */}
            <div className="auth-left">
                <div className="auth-content">
                    <h1 className="auth-logo">Welcome to<br></br>💰 Budgy</h1>
                    <p className="auth-subtitle">Your budgeting buddy for smarter spending</p>
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

            {/* Registration form on right */}
            <div className="auth-right">
                <div className="auth-form-wrapper">
                    <h2 className="form-title">Create Your Account</h2>
                    
                    {error && (
                        <div className="auth-error-message">
                            {error}
                        </div>
                    )}
                    
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