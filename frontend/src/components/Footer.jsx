import "../styles/Footer.css";

// Standard footer component
function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-content">
                    {/* Logo area */}
                    <div className="footer-section">
                        <h3 className="footer-logo">
                            <span className="logo-icon">💰</span>
                            Budgy
                        </h3>
                        <p className="footer-tagline">Your budgeting buddy.</p>
                    </div>
                    
                    {/* Navigation links */}
                    <div className="footer-section">
                        <h4>Quick Links</h4>
                        <ul className="footer-links">
                            <li><a href="/">Home</a></li>
                            <li><a href="/sorted-incomes">Sorted incomes</a></li>
                            <li><a href="/sort-income">Sort new income</a></li>
                        </ul>
                    </div>
                    
                    {/* Tool links */}
                    <div className="footer-section">
                        <h4>Tools</h4>
                        <ul className="footer-links">
                            <li><a href="/calendar">Calendar</a></li>
                            <li><a href="/currency-converter">Currency converter</a></li>
                            <li><a href="mailto:alexis.sammut26@gmail.com">Contact us</a></li>
                        </ul>
                    </div>
                </div>
                
                {/* Copyright line */}
                <div className="footer-bottom">
                    <p>&copy; {currentYear} Budgy. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;