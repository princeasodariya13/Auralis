import { useProducts } from '../hooks/useData';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from './Skeletons';
import { Link } from 'react-router-dom';

const RecentlyViewedRow = () => {
    const { viewedIds } = useRecentlyViewed();
    const { data: products, loading } = useProducts();

    if (!viewedIds || viewedIds.length === 0) {
        return null; // Don't show anything if history is empty
    }

    if (loading || !products) {
        // Only show skeleton if we actually have items in history
        return (
            <section className="section recently-viewed bg-gray-50">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Continue Browsing</h2>
                        <p className="section-subtitle">Pick up where you left off</p>
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

    // Map IDs back to product objects and filter out missing/inactive ones
    // We limit to 4 to match the standard grid length for a single row
    const recentProducts = viewedIds
        .map(id => products.find(p => p.id === id))
        .filter(p => p && p.availability !== 'inactive')
        .slice(0, 4);

    if (recentProducts.length === 0) {
        return null;
    }

    return (
        <section className="section recently-viewed bg-gray-50">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">Continue Browsing</h2>
                    <p className="section-subtitle">Pick up where you left off</p>
                </div>
                <div className="product-grid">
                    {recentProducts.map(product => (
                        <ProductCard key={`recent-${product.id}`} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default RecentlyViewedRow;
