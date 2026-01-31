import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/auth.css";

// Login component handling user authentication
function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Handle login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Get tokens and store them
      const res = await api.post("api/token/", { username, password });
      localStorage.setItem(ACCESS_TOKEN, res.data.access);
      localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
      navigate("/");
    } catch (error) {
      if (error.response) {
        // Server responded with error
        if (error.response.status === 401) {
          setError("Invalid username or password");
        } else if (error.response.data?.detail) {
          setError(error.response.data.detail);
        } else {
          setError("Login failed. Please try again.");
        }
      } else if (error.request) {
        // Request made but no response
        setError("Cannot connect to server. Please check your connection.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left side branding */}
      <div className="auth-left">
        <div className="auth-content">
          <h1 className="auth-logo">
            Welcome back to<br></br>💰 Budgy
          </h1>
          <p className="auth-subtitle">Ready to master your money?</p>
        </div>
      </div>

      {/* Right side form */}
      <div className="auth-right">
        <div className="auth-form-wrapper">
          <h2 className="form-title">Log In</h2>

          {error && <div className="auth-error-message">{error}</div>}

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

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? "Logging In..." : "Log In"}
            </button>
          </form>

          <div className="auth-switch">
            <p>Don't have an account?</p>
            <Link to="/register" className="switch-link">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
