import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, CheckCircle } from 'lucide-react';
import './Contact.css';

const Contact = () => {
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitted(true);
        setTimeout(() => setIsSubmitted(false), 5000);
    };
    return (
        <div className="contact-page">
            <div className="container section">
                <h1 className="text-center mb-5">Contact Us</h1>

                <div className="contact-wrapper">
                    <div className="contact-info">
                        <h2>Get In Touch</h2>
                        <p className="contact-intro">
                            Have a question about our collections or need assistance with your order? We're here to help.
                        </p>

                        <ul className="info-list">
                            <li>
                                <MapPin className="contact-icon" />
                                <div>
                                    <strong>Store Location</strong>
                                    <p>456 Soundwave Ave, Seattle, WA 98101</p>
                                </div>
                            </li>
                            <li>
                                <Phone className="contact-icon" />
                                <div>
                                    <strong>Phone</strong>
                                    <p>+1 (555) 123-4567</p>
                                </div>
                            </li>
                            <li>
                                <Mail className="contact-icon" />
                                <div>
                                    <strong>Email</strong>
                                    <p>contact@auralis.audio</p>
                                </div>
                            </li>
                            <li>
                                <Clock className="contact-icon" />
                                <div>
                                    <strong>Hours</strong>
                                    <p>Mon-Fri: 10am - 8pm</p>
                                    <p>Sat-Sun: 11am - 6pm</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="contact-form-container">
                        <h2>Send a Message</h2>
                        <form className="contact-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Name</label>
                                <input type="text" placeholder="Your Name" required disabled={isSubmitted} />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" placeholder="Your Email" required disabled={isSubmitted} />
                            </div>
                            <div className="form-group">
                                <label>Subject</label>
                                <input type="text" placeholder="Subject" disabled={isSubmitted} />
                            </div>
                            <div className="form-group">
                                <label>Message</label>
                                <textarea rows="5" placeholder="Your Message" required disabled={isSubmitted}></textarea>
                            </div>
                            
                            {isSubmitted ? (
                                <div className="text-success mt-2 mb-3 d-flex align-items-center gap-2" style={{ color: '#16a34a', fontWeight: '500' }}>
                                    <CheckCircle size={18} /> Message recorded (Demo Mode)
                                </div>
                            ) : null}

                            <button type="submit" className="btn btn-primary" disabled={isSubmitted}>
                                {isSubmitted ? 'Sent' : 'Send Message'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
