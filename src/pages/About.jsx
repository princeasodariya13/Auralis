import './About.css';

const About = () => {
    return (
        <div className="about-page">
            <div className="about-hero">
                <div className="container">
                    <h1>Our Story</h1>
                </div>
            </div>

            <section className="container section about-content">
                <div className="about-grid">
                    <div className="about-text">
                        <h2>Perfecting Sound Since 2010</h2>
                        <p>
                            Founded in the heart of Seattle, Auralis began with a simple mission: to provide audiophiles with premium gear that brings music to life.
                        </p>
                        <p>
                            We believe that audio is more than just listening; it's an immersive experience. Each product in our collection is carefully curated from top manufacturers and sound engineers globally.
                        </p>
                        <p>
                            From the crisp highs of a studio monitor to the deep bass of our ANC headphones, our gear is designed for those who refuse to compromise on sound quality.
                        </p>
                    </div>
                    <div className="about-image">
                        <img src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Audio equipment" />
                    </div>
                </div>

                <div className="values-section">
                    <h2>Our Values</h2>
                    <div className="values-grid">
                        <div className="value-card">
                            <h3>Performance</h3>
                            <p>Uncompromising sound quality in every device.</p>
                        </div>
                        <div className="value-card">
                            <h3>Innovation</h3>
                            <p>Curating the latest in audio technology.</p>
                        </div>
                        <div className="value-card">
                            <h3>Passion</h3>
                            <p>Driven by our love for music and superior sound.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
