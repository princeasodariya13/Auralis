import { Link } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
    return (
        <section className="hero">
            <div className="hero-overlay"></div>
            <div className="hero-content container">
                <span className="hero-eyebrow">Premium Audio Engineering</span>
                <h1 className="hero-title">
                    Sound Without<br /><em>Compromise</em>
                </h1>
                <p className="hero-subtitle">
                    Curated headphones, speakers, and audio gear for the discerning listener. Engineered for those who refuse to settle.
                </p>
                <div className="hero-actions">
                    <Link to="/shop" className="btn hero-btn">
                        Explore Collection
                    </Link>
                    <Link to="/about" className="hero-btn-secondary">
                        Our Story
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default Hero;
