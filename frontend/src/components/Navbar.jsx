import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../styles/Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const toggleToolsDropdown = () => {
    setShowToolsDropdown(!showToolsDropdown);
  };

  const closeDropdown = () => {
    setShowToolsDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar-green">
      <div className="navbar-container">
        {/* Left: Logo/Brand */}
        <div className="navbar-brand">
          <span className="brand-icon">💰</span>
          <span className="brand-text">Budget</span>
        </div>

        {/* Center: Main Navigation */}
        <div className="navbar-links">
          <Link to="/" className="nav-link">
            <span className="nav-icon">📂</span>
            Pockets
          </Link>
          <Link to="/sorted-incomes" className="nav-link">
            <span className="nav-icon">📊</span>
            Sorted Incomes
          </Link>
          
          {/* Tools Dropdown */}
          <div className="nav-dropdown" ref={dropdownRef}>
            <button 
              className="nav-link dropdown-toggle" 
              onClick={toggleToolsDropdown}
            >
              <span className="nav-icon">🛠️</span>
              Tools
              <span className={`dropdown-arrow ${showToolsDropdown ? 'open' : ''}`}>▼</span>
            </button>
            
            {showToolsDropdown && (
              <div className="dropdown-menu">
                <Link 
                  to="/calendar" 
                  className="dropdown-item"
                  onClick={closeDropdown}
                >
                  <span className="dropdown-icon">📅</span>
                  Calendar
                </Link>
                <Link 
                  to="/currency-converter" 
                  className="dropdown-item"
                  onClick={closeDropdown}
                >
                  <span className="dropdown-icon">🔄</span>
                  Currency Converter
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right: Action Button */}
        <div className="navbar-actions">
          <Link to="/sort-income" className="add-btn">
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