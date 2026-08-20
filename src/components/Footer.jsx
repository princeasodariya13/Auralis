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
                    <Link to="/" className="footer-logo">
                        <img src="/auralis-logo.png" alt="Auralis Logo" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                    </Link>
                    <p className="footer-text">
                        Delivering pure sound and premium gear for the modern audiophile. Engineered for those who refuse to compromise.
                    </p>
                    <div className="social-icons">
                        <a href="#" aria-label="Facebook"><Facebook size={16} /></a>
                        <a href="#" aria-label="Instagram"><Instagram size={16} /></a>
                        <a href="#" aria-label="Twitter"><Twitter size={16} /></a>
                    </div>
                </div>

                <div className="footer-section links">
                    <h3>Navigate</h3>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/shop">Shop Gear</Link></li>
                        <li><Link to="/about">Our Story</Link></li>
                        <li><Link to="/contact">Contact</Link></li>
                    </ul>
                </div>

                <div className="footer-section contact">
                    <h3>Contact</h3>
                    <ul>
                        <li><MapPin size={15} /><span>Mumbai, Maharashtra, India</span></li>
                        <li><Mail size={15} /><span>contact@auralis.audio</span></li>
                        <li><Phone size={15} /><span>+91 98765 43210</span></li>
                    </ul>
                </div>

                <div className="footer-section newsletter">
                    <h3>Newsletter</h3>
                    <p>Subscribe for new arrivals, exclusive offers, and audiophile insights.</p>
                    <form className="newsletter-form" onSubmit={handleSubscribe}>
                        <input type="email" placeholder="your@email.com" required disabled={subscribed} />
                        <button
                            type="submit"
                            className="btn btn-sm btn-primary"
                            disabled={subscribed}
                            style={subscribed ? { backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' } : {}}
                        >
                            {subscribed ? <><Check size={14} /> Subscribed</> : 'Subscribe'}
                        </button>
                    </form>
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
