import { useState } from 'react';
import { Facebook, Instagram, Twitter, MapPin, Mail, Phone, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = (e) => {
        e.preventDefault();
        setSubscribed(true);
        setTimeout(() => setSubscribed(false), 3000);
    };
    return (
        <footer className="footer">
            <div className="container footer-container">
                <div className="footer-section brand">
                    <Link to="/" className="footer-logo">AURALIS</Link>
                    <p className="footer-text">
                        Delivering pure sound and premium gear for the modern audiophile. Our equipment is designed to elevate your listening experience.
                    </p>
                    <div className="social-icons">
                        <a href="#" aria-label="Facebook"><Facebook size={20} /></a>
                        <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
                        <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
                    </div>
                </div>

                <div className="footer-section links">
                    <h3>Quick Links</h3>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/shop">Shop Gear</Link></li>
                        <li><Link to="/about">Our Story</Link></li>
                        <li><Link to="/contact">Contact Us</Link></li>
                    </ul>
                </div>

                <div className="footer-section contact">
                    <h3>Contact Us</h3>
                    <ul>
                        <li>
                            <MapPin size={18} />
                            <span>123 Fifth Avenue, New York, NY 10160</span>
                        </li>
                        <li>
                            <Mail size={18} />
                            <span>contact@auralis.audio</span>
                        </li>
                        <li>
                            <Phone size={18} />
                            <span>+1 (555) 123-4567</span>
                        </li>
                    </ul>
                </div>

                <div className="footer-section newsletter">
                    <h3>Newsletter</h3>
                    <p>Subscribe to receive updates, access to exclusive deals, and more.</p>
                    <form className="newsletter-form" onSubmit={handleSubscribe}>
                        <input type="email" placeholder="Enter your email" required disabled={subscribed} />
                        <button type="submit" className={`btn ${subscribed ? 'btn-success' : 'btn-primary'}`} disabled={subscribed} style={subscribed ? { backgroundColor: '#16a34a', borderColor: '#16a34a' } : {}}>
                            {subscribed ? <><Check size={16}/> Done</> : 'Subscribe'}
                        </button>
                    </form>
                    {subscribed && <p style={{ color: '#16a34a', fontSize: '0.8rem', marginTop: '0.5rem' }}>Subscribed (Demo Mode)</p>}
                </div>
            </div>

            <div className="footer-bottom">
                <div className="container">
                    <p>&copy; {new Date().getFullYear()} Auralis. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
