import "../styles/Footer.css";

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3 className="footer-logo">
                            <span className="logo-icon">💰</span>
                            Budgy
                        </h3>
                        <p className="footer-tagline">Smart budgeting made simple</p>
                    </div>
                    
                    <div className="footer-section">
                        <h4>Quick Links</h4>
                        <ul className="footer-links">
                            <li><a href="/">Home</a></li>
                            <li><a href="/budget">Budget</a></li>
                            <li><a href="/history">History</a></li>
                        </ul>
                    </div>
                    
                    <div className="footer-section">
                        <h4>Support</h4>
                        <ul className="footer-links">
                            <li><a href="#">Help Center</a></li>
                            <li><a href="#">Contact Us</a></li>
                            <li><a href="#">Privacy Policy</a></li>
                        </ul>
                    </div>
                </div>
                
                <div className="footer-bottom">
                    <p>&copy; {currentYear} Budgy. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;