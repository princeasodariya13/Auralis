import { Link } from 'react-router-dom';
import { useCategories } from '../hooks/useData';
import { ErrorState } from './States';
import './AudioCategories.css';

const AudioCategories = () => {
    const { data: categories, loading, error } = useCategories();

    if (error) return null; // Fail gracefully for categories

    return (
        <section className="section featured-collections">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">Shop by Category</h2>
                    <p className="section-subtitle">Browse headphones, speakers, and accessories</p>
                </div>

                <div className="collections-grid">
                    {loading ? (
                        <>
                            <div className="collection-card" style={{height: '300px', backgroundColor: 'var(--color-gray-100)', animation: 'pulse 1.5s infinite ease-in-out'}}></div>
                            <div className="collection-card" style={{height: '300px', backgroundColor: 'var(--color-gray-100)', animation: 'pulse 1.5s infinite ease-in-out'}}></div>
                            <div className="collection-card" style={{height: '300px', backgroundColor: 'var(--color-gray-100)', animation: 'pulse 1.5s infinite ease-in-out'}}></div>
                        </>
                    ) : (
                        categories.map((category) => (
                            <Link to={`/shop?category=${category.id}`} key={category.id} className="collection-card">
                                <div className="collection-image-wrapper">
                                    {category.image ? (
                                        <img src={category.image} alt={category.name} className="collection-image" />
                                    ) : (
                                        <div className="collection-image-placeholder" style={{width: '100%', height: '100%', backgroundColor: 'var(--color-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-gray-400)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                <polyline points="21 15 16 10 5 21"></polyline>
                                            </svg>
                                        </div>
                                    )}
                                    <div className="collection-overlay">
                                        <h3 className="collection-name">{category.name}</h3>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
};

export default AudioCategories;
