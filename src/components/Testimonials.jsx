import { useTestimonials } from '../hooks/useData';
import { Star } from 'lucide-react';
import './Testimonials.css';

const Testimonials = () => {
    const { data: testimonials, loading, error } = useTestimonials();

    if (error || loading) return null; // Fail gracefully or hide while loading

    return (
        <section className="section testimonials-section">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">Client Stories</h2>
                    <p className="section-subtitle">What our customers say about us</p>
                </div>

                <div className="testimonials-grid">
                    {testimonials.map(item => (
                        <div key={item.id} className="testimonial-card">
                            <div className="stars">
                                {[...Array(item.rating)].map((_, i) => (
                                    <Star key={i} size={16} fill="currentColor" strokeWidth={0} className="star-icon" />
                                ))}
                            </div>
                            <p className="testimonial-text">"{item.text}"</p>
                            <h4 className="testimonial-author">- {item.name}</h4>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
