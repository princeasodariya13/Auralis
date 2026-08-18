import { useParams, useNavigate } from 'react-router-dom';
import { useProduct, useReviews } from '../hooks/useData';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ShoppingBag, ArrowLeft, Star, Truck, ShieldCheck, RefreshCw, Heart } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { ProductDetailsSkeleton } from '../components/Skeletons';
import { ErrorState, EmptyState } from '../components/States';
import Reviews from '../components/Reviews';
import RecommendationRow from '../components/RecommendationRow';
import { useRecommendations } from '../hooks/useRecommendations';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import './ProductDetails.css';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();

    const [refreshKey, setRefreshKey] = useState(0);
    const { data: product, loading: productLoading, error: productError } = useProduct(id);
    const { data: reviewsData, loading: reviewsLoading } = useReviews(id, { refreshKey });
    const { related, frequentlyBought, loading: recsLoading } = useRecommendations(id);
    const { addViewedProduct } = useRecentlyViewed();

    const [activeImage, setActiveImage] = useState(0);
    const [addedToCart, setAddedToCart] = useState(false);

    useEffect(() => {
        if (product && !productLoading) {
            addViewedProduct(product.id);
            // Log Analytics
            import('../services/apiService').then(mod => {
                mod.analyticsService.logEvent('PRODUCT_VIEWED', parseInt(product.id));
            });
        }
    }, [product, productLoading, addViewedProduct]);

    const handleReviewChanged = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    if (productLoading) {
        return <ProductDetailsSkeleton />;
    }

    if (productError) {
        return <ErrorState message={productError} onRetry={() => window.location.reload()} />;
    }

    if (!product) {
        return (
            <EmptyState 
                message="Product not found" 
                actionText="Back to Shop" 
                onAction={() => navigate('/shop')} 
            />
        );
    }

    const handleAddToCart = () => {
        addToCart(product);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const handleBuyNow = () => {
        addToCart(product);
        navigate('/cart');
    };

    const handleWishlistClick = async () => {
        const success = await toggleWishlist(product.id);
        if (!success) {
            navigate('/login');
        }
    };

    const avgRating = reviewsData?.stats?.average || 0;
    const reviewCount = reviewsData?.stats?.count || 0;

    return (
        <div className="product-details-page container section">
            <button onClick={() => navigate(-1)} className="back-btn">
                <ArrowLeft size={18} /> Back
            </button>

            <div className="product-details-grid">
                {/* Product Images */}
                <div className="product-gallery">
                    <div className="main-image-wrapper">
                        <img src={product.image} alt={product.name} className="main-image" />
                    </div>
                    {/* Mock secondary images */}
                    <div className="thumbnail-list">
                        {[product.image, product.image, product.image].map((img, index) => (
                            <button
                                key={index}
                                className={`thumbnail-btn ${activeImage === index ? 'active' : ''}`}
                                onClick={() => setActiveImage(index)}
                            >
                                <img src={img} alt={`View ${index + 1}`} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Info */}
                <div className="product-info-column">
                    <span className="product-category-tag">{product.category}</span>
                    <h1 className="details-title">{product.name}</h1>

                    <div className="rating-container">
                        <div className="stars">
                            {[1, 2, 3, 4, 5].map(star => (
                                <Star 
                                    key={star} 
                                    size={16} 
                                    fill={star <= Math.round(avgRating) ? "#C9A24D" : "none"} 
                                    color={star <= Math.round(avgRating) ? "#C9A24D" : "var(--color-gray-400)"} 
                                />
                            ))}
                        </div>
                        <span className="rating-text">
                            {reviewCount > 0 ? `(${reviewCount} Review${reviewCount > 1 ? 's' : ''})` : 'No reviews yet'}
                        </span>
                    </div>

                    <div className="price-container">
                        <span className="current-price">${product.price.toLocaleString()}</span>
                    </div>

                    <p className="product-description">{product.description}</p>

                    <div style={{ marginBottom: '1.5rem' }}>
                        {product.availability === 'out_of_stock' && (
                            <span style={{ color: '#dc2626', fontWeight: 600 }}>Out of Stock</span>
                        )}
                        {product.availability === 'low_stock' && (
                            <span style={{ color: '#d97706', fontWeight: 600 }}>Only a few left</span>
                        )}
                        {product.availability === 'in_stock' && (
                            <span style={{ color: '#16a34a', fontWeight: 600 }}>In Stock</span>
                        )}
                        {product.availability === 'inactive' && (
                            <span style={{ color: '#6b7280', fontWeight: 600 }}>Currently Unavailable</span>
                        )}
                    </div>

                    <div className="action-buttons">
                        <button 
                            className={`btn ${addedToCart ? 'btn-primary' : 'btn-outline'} flex-1`}
                            onClick={handleAddToCart}
                            disabled={['out_of_stock', 'inactive'].includes(product.availability) || addedToCart}
                        >
                            <ShoppingBag size={18} /> {addedToCart ? 'Added ✓' : 'Add to Cart'}
                        </button>
                        <button 
                            className="btn btn-primary flex-1" 
                            onClick={handleBuyNow}
                            disabled={['out_of_stock', 'inactive'].includes(product.availability)}
                        >
                            Buy Now
                        </button>
                        <button 
                            className={`btn btn-outline wishlist-action-btn ${isInWishlist(product.id) ? 'active' : ''}`} 
                            onClick={handleWishlistClick}
                            aria-label="Toggle Wishlist"
                            title="Add to Wishlist"
                        >
                            <Heart size={18} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
                        </button>
                    </div>

                    <div className="features-list">
                        <div className="feature-item">
                            <Truck size={20} />
                            <span>Free specialized shipping</span>
                        </div>
                        <div className="feature-item">
                            <ShieldCheck size={20} />
                            <span>2 Year Warranty</span>
                        </div>
                        <div className="feature-item">
                            <RefreshCw size={20} />
                            <span>30 Day Returns</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            {!reviewsLoading && (
                <Reviews 
                    productId={product.id} 
                    reviewsData={reviewsData} 
                    onReviewChanged={handleReviewChanged}
                />
            )}

            {/* Recommendations Section */}
            <div style={{ marginTop: '2rem' }}>
                <RecommendationRow 
                    title="Frequently Bought Together"
                    products={frequentlyBought}
                    loading={recsLoading}
                />
                
                <RecommendationRow 
                    title="Related Products"
                    subtitle="Customers also viewed"
                    products={related}
                    loading={recsLoading}
                />
            </div>
        </div>
    );
};

export default ProductDetails;
