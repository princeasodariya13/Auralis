import ProductCard from './ProductCard';
import { ProductCardSkeleton } from './Skeletons';

const RecommendationRow = ({ title, subtitle, products, loading }) => {
    if (loading) {
        return (
            <section className="section recommendations">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">{title}</h2>
                        {subtitle && <p className="section-subtitle">{subtitle}</p>}
                    </div>
                    <div className="product-grid">
                        <ProductCardSkeleton />
                        <ProductCardSkeleton />
                        <ProductCardSkeleton />
                        <ProductCardSkeleton />
                    </div>
                </div>
            </section>
        );
    }

    if (!products || products.length === 0) {
        return null; // Fail gracefully, don't show the section
    }

    return (
        <section className="section recommendations">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">{title}</h2>
                    {subtitle && <p className="section-subtitle">{subtitle}</p>}
                </div>
                <div className="product-grid">
                    {products.map(product => (
                        <ProductCard key={`rec-${product.id}`} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default RecommendationRow;
