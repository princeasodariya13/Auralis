import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Volume2 } from 'lucide-react';
import './Hero.css';

const Hero = () => {
    return (
        <section className="hero">
            {/* Ultra HD Background Image */}
            <div className="hero-bg-image-wrapper">
                <img 
                    src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=2400&q=90" 
                    alt="Auralis HD Audio Engineering" 
                    className="hero-bg-img"
                    fetchPriority="high"
                />
            </div>
            
            {/* Elegant Gradient Overlay */}
            <div className="hero-overlay"></div>

            <div className="hero-content container">
                <div className="hero-left-col">
                    <span className="hero-eyebrow">
                        <Sparkles size={14} /> PREMIUM AUDIO ENGINEERING
                    </span>
                    <h1 className="hero-title">
                        Sound Without<br /><em>Compromise</em>
                    </h1>
                    <p className="hero-subtitle">
                        Curated headphones, speakers, and audiophile gear. Precision engineered for those who demand ultimate clarity.
                    </p>
                    <div className="hero-actions">
                        <Link to="/shop" className="hero-btn cta-hero-primary">
                            <span>Explore Collection</span>
                            <ArrowRight size={18} />
                        </Link>
                        <Link to="/about" className="hero-btn-secondary">
                            Our Acoustic Story
                        </Link>
                    </div>

                    <div className="hero-meta-strip">
                        <div className="hero-meta-item">
                            <Volume2 size={16} />
                            <span>Hi-Res Audio Certified</span>
                        </div>
                        <div className="hero-meta-item">
                            <ShieldCheck size={16} />
                            <span>Official 1-Year Warranty</span>
                        </div>
                    </div>
                </div>

                {/* Right Column Floating Showcase Card */}
                <div className="hero-showcase-card desktop-only">
                    <div className="showcase-glass-box">
                        <span className="showcase-tag">FLAGSHIP GEAR</span>
                        <h4>Auralis Studio Pro X</h4>
                        <p>Active Noise Cancellation • 40h Battery</p>
                        <Link to="/shop?category=Headphones" className="showcase-link">
                            View Specs <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
