import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../styles/Navbar.css";

function Navbar() {
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const toggleToolsDropdown = () => {
    setShowToolsDropdown(!showToolsDropdown);
  };

  const closeDropdown = () => {
    setShowToolsDropdown(false);
  };

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
        <div className="navbar-brand">
          <span className="brand-icon">💰</span>
          <span className="brand-text">Budgy</span>
        </div>

        <div className="navbar-links">
          <Link to="/" className="nav-link">
            <span className="nav-icon">📂</span>
            Pockets
          </Link>
          <Link to="/sorted-incomes" className="nav-link">
            <span className="nav-icon">📊</span>
            Sorted Incomes
          </Link>
          
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

        <div className="navbar-actions">
          <Link to="/sort-income" className="create-btn">
            + Sort Income
          </Link>
          <Link to="/profile" className="profile-icon-btn">
            👤
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;