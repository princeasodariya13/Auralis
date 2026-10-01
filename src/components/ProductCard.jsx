import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatINR } from '../utils/formatCurrency';
import './ProductCard.css';

const ProductCard = ({ product }) => {
    const { addToCart } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const navigate = useNavigate();

    const handleAddToCart = (e) => {
        e.preventDefault();
        addToCart(product);
    };

    const handleWishlistClick = async (e) => {
        e.preventDefault();
        const success = await toggleWishlist(product.id);
        if (!success) {
            navigate('/login');
        }
    };

    return (
        <div className="product-card" onClick={() => navigate(`/product/${product.id}`)} role="button" tabIndex="0" onKeyDown={(e) => { if(e.key==='Enter') navigate(`/product/${product.id}`) }}>
            <div className="product-image-container">
                <img 
                    src={product.image || 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=85'} 
                    alt={product.name} 
                    className="product-image" 
                    loading="lazy" 
                    onError={(e) => {
                        e.target.onerror = null;
                        const cat = product.category || '';
                        if (cat.includes('Headphone')) {
                            e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85';
                        } else if (cat.includes('Speaker')) {
                            e.target.src = 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=85';
                        } else if (cat.includes('Earphone')) {
                            e.target.src = 'https://images.unsplash.com/photo-1545127398-14699f92334b?auto=format&fit=crop&w=1200&q=85';
                        } else {
                            e.target.src = 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=85';
                        }
                    }}
                />
                <button 
                    className={`wishlist-btn ${isInWishlist(product.id) ? 'active' : ''}`}
                    onClick={handleWishlistClick}
                    aria-label="Toggle wishlist"
                >
                    <Heart size={20} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
                </button>
                <button
                    className="add-to-cart-btn"
                    onClick={handleAddToCart}
                    aria-label="Add to cart"
                    disabled={['out_of_stock', 'inactive'].includes(product.availability)}
                    title={
                        product.availability === 'out_of_stock' ? 'Out of Stock' :
                        product.availability === 'inactive' ? 'Unavailable' : 'Add to Cart'
                    }
                >
                    <ShoppingBag size={15} />
                    {product.availability === 'out_of_stock' ? 'Out of Stock' :
                     product.availability === 'inactive' ? 'Unavailable' : 'Add to Cart'}
                </button>
                {product.availability === 'out_of_stock' && (
                    <div className="stock-badge out-of-stock-badge">OUT OF STOCK</div>
                )}
                {product.availability === 'inactive' && (
                    <div className="stock-badge inactive-badge">UNAVAILABLE</div>
                )}
                {product.availability === 'low_stock' && (
                    <div className="stock-badge low-stock-badge">LOW STOCK</div>
                )}
            </div>
            <div className="product-info">
                <span className="product-category">{product.category}</span>
                <h3 className="product-title">
                    <Link to={`/product/${product.id}`} onClick={(e) => e.stopPropagation()}>{product.name}</Link>
                </h3>
                <span className="product-price">{formatINR(product.price)}</span>
            </div>
        </div>
    );
};

ProductCard.propTypes = {
    product: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        price: PropTypes.number.isRequired,
        category: PropTypes.string.isRequired,
        image: PropTypes.string.isRequired,
    }).isRequired,
};

export default ProductCard;
