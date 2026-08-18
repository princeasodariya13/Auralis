import { useProducts } from '../hooks/useData';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from './Skeletons';
import { ErrorState } from './States';
import './TopGear.css';

const TopGear = () => {
    const { data: products, loading, error } = useProducts();
    const bestSellers = products ? products.filter(p => p.isBestSeller).slice(0, 4) : [];

    if (error) {
        return <ErrorState message="Could not load Top Gear products at this time." />;
    }

    return (
        <section className="section best-sellers">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">Top Gear</h2>
                    <p className="section-subtitle">Our most popular gear</p>
                </div>  

                <div className="product-grid">
                    {loading ? (
                        <>
                            <ProductCardSkeleton />
                            <ProductCardSkeleton />
                            <ProductCardSkeleton />
                            <ProductCardSkeleton />
                        </>
                    ) : (
                        bestSellers.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    )}
                </div>
            </div>
        </section>
    );
};

export default TopGear;
