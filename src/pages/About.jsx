import { Headphones, ShieldCheck, Sparkles, Volume2, Award, Zap, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './About.css';

const About = () => {
    return (
        <div className="about-page">
            {/* Hero Banner Section */}
            <div className="about-hero">
                <div className="about-hero-overlay"></div>
                <div className="container about-hero-content">
                    <span className="about-badge">
                        <Award size={14} className="badge-icon" /> ESTABLISHED 2010
                    </span>
                    <h1>Our Story & Acoustic Craftsmanship</h1>
                    <p className="about-subtitle">
                        Designing high-fidelity audio gear for audiophiles and sound purists who refuse to compromise on clarity.
                    </p>
                </div>
            </div>

            {/* Main Story & HD Image Showcase */}
            <section className="container section about-content">
                <div className="about-grid">
                    <div className="about-text">
                        <span className="section-kicker">SEATTLE AUDIO LABS</span>
                        <h2>Perfecting Sound Since 2010</h2>
                        <p className="about-lead">
                            Founded in the heart of Seattle, Auralis began with a simple mission: to eliminate sound distortion and bring studio-grade master audio directly into your hands.
                        </p>
                        <p>
                            We believe that music is more than background noise—it's an emotional journey. Every acoustic chamber, dynamic driver, and magnetic coil in our gear is meticulously engineered and calibrated by veteran sound engineers.
                        </p>
                        <p>
                            From the crisp highs of a studio monitor headphone to the deep sub-bass of our active noise-canceling earbuds, Auralis gear delivers true frequency fidelity.
                        </p>

                        {/* Brand Stats Row */}
                        <div className="about-stats">
                            <div className="stat-item">
                                <span className="stat-number">15+</span>
                                <span className="stat-label">Years of Acoustics</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">100K+</span>
                                <span className="stat-label">Happy Audiophiles</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">99.4%</span>
                                <span className="stat-label">Fidelity Rating</span>
                            </div>
                        </div>
                    </div>

                    <div className="about-image-wrapper">
                        <img 
                            src="https://images.unsplash.com/photo-1590658006821-04f4008d5717?q=80&w=1200&auto=format&fit=crop" 
                            alt="Auralis Studio Audio Precision Gear" 
                            className="about-hd-image" 
                            loading="lazy"
                        />
                        <div className="about-image-glass-card">
                            <div className="glass-card-header">
                                <Volume2 size={20} className="text-gold" />
                                <div>
                                    <h4 className="glass-card-title">Auralis Sound Labs</h4>
                                    <p className="glass-card-subtitle">Precision Acoustic Chamber #04</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Values Section */}
                <div className="values-section">
                    <div className="values-header">
                        <span className="section-kicker">OUR PILLARS</span>
                        <h2>Engineered For Perfection</h2>
                        <p className="values-intro">The four uncompromising principles behind every Auralis acoustic innovation.</p>
                    </div>

                    <div className="values-grid">
                        <div className="value-card">
                            <div className="value-icon-wrapper">
                                <Volume2 size={24} />
                            </div>
                            <h3>Acoustic Precision</h3>
                            <p>Custom titanium drivers tuned to flat-response curves, capturing every subtle nuance of master recordings.</p>
                        </div>

                        <div className="value-card">
                            <div className="value-icon-wrapper">
                                <ShieldCheck size={24} />
                            </div>
                            <h3>Master Workmanship</h3>
                            <p>Built with anodized aircraft aluminum, stainless steel hinges, and ultra-breathable memory foam.</p>
                        </div>

                        <div className="value-card">
                            <div className="value-icon-wrapper">
                                <Sparkles size={24} />
                            </div>
                            <h3>Lossless Audio Tech</h3>
                            <p>Powered by ultra-low-latency Bluetooth 5.4, LDAC codec support, and adaptive active noise cancellation.</p>
                        </div>

                        <div className="value-card">
                            <div className="value-icon-wrapper">
                                <Headphones size={24} />
                            </div>
                            <h3>Audiophile First</h3>
                            <p>Co-designed and field-tested alongside studio recording engineers to guarantee raw audio purity.</p>
                        </div>
                    </div>
                </div>

                {/* Studio Craft Gallery Section */}
                <div className="studio-gallery-section">
                    <div className="gallery-card">
                        <img 
                            src="https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=1000&auto=format&fit=crop" 
                            alt="Studio Acoustic Calibration" 
                            className="gallery-img"
                        />
                        <div className="gallery-overlay">
                            <h3>Acoustic Calibration</h3>
                            <p>Each driver undergoes 100+ point frequency curve benchmarking.</p>
                        </div>
                    </div>

                    <div className="gallery-card">
                        <img 
                            src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000&auto=format&fit=crop" 
                            alt="Sound Engineering Console" 
                            className="gallery-img"
                        />
                        <div className="gallery-overlay">
                            <h3>Master Mixing Compatibility</h3>
                            <p>Optimized for high-impedance studio gear and everyday mobile playback.</p>
                        </div>
                    </div>
                </div>

                {/* Call to Action Banner */}
                <div className="about-cta">
                    <div className="cta-content">
                        <h2>Experience True High-Fidelity Today</h2>
                        <p>Explore our flagship headphones, earbuds, and studio monitors.</p>
                    </div>
                    <Link to="/shop" className="btn btn-primary cta-btn">
                        Explore Collection <ChevronRight size={18} />
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default About;

