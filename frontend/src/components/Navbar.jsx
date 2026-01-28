import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav className="navbar-green">
      <div className="navbar-container">
        {/* Left: Logo/Brand */}
        <Link to="/pockets" className="navbar-brand">
          <span className="brand-icon">💰</span>
          <span className="brand-text">Budget</span>
        </Link>

        {/* Center: Main Navigation */}
        <div className="navbar-links">
          <Link to="/pockets" className="nav-link">
            <span className="nav-icon">📂</span>
            Pockets
          </Link>
          <Link to="/sorted-incomes" className="nav-link">
            <span className="nav-icon">📊</span>
            Sorted Incomes
          </Link>
          <Link to="/converter" className="nav-link">
            <span className="nav-icon">🔄</span>
            Converter
          </Link>
        </div>

        {/* Right: Action Button */}
        <div className="navbar-actions">
          <Link to="/sort-income" className="nav-btn-primary">
            + Sort Income
          </Link>
          <button onClick={handleLogout} className="nav-btn-logout">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;