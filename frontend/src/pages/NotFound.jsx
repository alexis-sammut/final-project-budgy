import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Index.css";

// Custom 404 page with funny quotes
function NotFound() {
  const navigate = useNavigate();
  
  // Array of budgeting-related error messages
  const messages = [
    {
      title: "404: Not a Penny Found!",
      subtitle: "Looks like this page is out of budget... and out of existence!"
    },
    {
      title: "404: Zero Balance Here!",
      subtitle: "This page spent all its resources and disappeared."
    },
    {
      title: "404: Budget Overrun!",
      subtitle: "We allocated zero funds for this page. It doesn't exist!"
    },
    {
      title: "404: Account Empty!",
      subtitle: "Sorry, your search didn't yield any returns on this investment."
    },
    {
      title: "404: Insufficient Funds!",
      subtitle: "This page couldn't afford to exist. Try another route!"
    }
  ];

  // Pick a random message on mount
  const [message] = useState(() => messages[Math.floor(Math.random() * messages.length)]);

  return (
    <div className="notfound-container">
      <div className="notfound-content">
        <div className="notfound-icon">💸</div>
        <h1 className="notfound-title">{message.title}</h1>
        <p className="notfound-subtitle">{message.subtitle}</p>
        
        <div className="notfound-actions">
          <button 
            className="notfound-btn primary"
            onClick={() => navigate("/")}
          >
            💰 Back to Your Pockets
          </button>
          <button 
            className="notfound-btn secondary"
            onClick={() => navigate(-1)}
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;