import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
    const navigate = useNavigate();
    
    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <span className="logo-icon">💰</span>
                    Budgy
                </Link>
                
                <div className="navbar-menu">
                    <Link to="/" className="navbar-link">
                        Home
                    </Link>
                    <Link to="/budget" className="navbar-link">
                        Budget
                    </Link>
                    <Link to="/history" className="navbar-link">
                        History
                    </Link>
                    <button onClick={handleLogout} className="logout-btn">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;