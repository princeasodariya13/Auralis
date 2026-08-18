import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductCardSkeleton } from '../components/Skeletons';
import './Wishlist.css';

const Wishlist = () => {
    const { wishlist, isWishlistLoading } = useWishlist();

    if (isWishlistLoading) {
        return (
            <div className="container section">
                <div className="section-header">
                    <h1>Your Wishlist</h1>
                </div>
                <div className="product-grid">
                    {[...Array(4)].map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (!wishlist || wishlist.length === 0) {
        return (
            <div className="container section">
                <div className="wishlist-empty">
                    <Heart size={48} className="empty-icon" />
                    <h2>Your wishlist is waiting.</h2>
                    <p>Save audio gear you love and come back to it later.</p>
                    <Link to="/shop" className="btn btn-primary">
                        Explore Audio Gear
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container section wishlist-page">
            <div className="section-header">
                <h1>Your Wishlist</h1>
                <p className="text-muted">{wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}</p>
            </div>

            <div className="product-grid">
                {wishlist.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
};

export default Wishlist;
