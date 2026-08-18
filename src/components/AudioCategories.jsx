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
                    <p className="section-subtitle">Explore our audio gear</p>
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
                                    <img src={category.image} alt={category.name} className="collection-image" />
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
