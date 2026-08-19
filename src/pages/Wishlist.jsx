import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProductCardSkeleton } from '../components/Skeletons';
import { EmptyState } from '../components/States';
import './Wishlist.css';

const Wishlist = () => {
    const { wishlist, isWishlistLoading } = useWishlist();
    const navigate = useNavigate();

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
                <EmptyState 
                    icon={Heart}
                    title="Your wishlist is waiting." 
                    message="Save audio gear you love and come back to it later." 
                    actionText="Explore Audio Gear" 
                    onAction={() => navigate('/shop')} 
                />
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
