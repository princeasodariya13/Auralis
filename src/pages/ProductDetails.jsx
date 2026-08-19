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
            {/* Breadcrumb */}
            <div className="amazon-breadcrumb">
                <span className="breadcrumb-link" onClick={() => navigate('/')}>Home</span>
                <span className="breadcrumb-separator">›</span>
                <span className="breadcrumb-link" onClick={() => navigate('/shop')}>Electronics</span>
                <span className="breadcrumb-separator">›</span>
                <span className="breadcrumb-link" onClick={() => navigate(`/shop?category=${product.category}`)}>{product.category}</span>
                <span className="breadcrumb-separator">›</span>
                <span className="breadcrumb-current">{product.name}</span>
            </div>

            <div className="product-details-grid">
                {/* Product Images */}
                <div className="product-gallery">
                    <div className="main-image-wrapper">
                        <img 
                            src={product.images && product.images.length > 0 ? product.images[activeImage]?.url : (product.image || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="%23f1f5f9"/><text x="300" y="300" font-family="sans-serif" font-size="24" fill="%2394a3b8" text-anchor="middle" dominant-baseline="middle">Image Unavailable</text></svg>')} 
                            alt={product.name} 
                            className="main-image" 
                            fetchPriority="high" 
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="%23f1f5f9"/><text x="300" y="300" font-family="sans-serif" font-size="24" fill="%2394a3b8" text-anchor="middle" dominant-baseline="middle">Image Unavailable</text></svg>';
                            }}
                        />
                    </div>
                    {/* Secondary images */}
                    {(product.images && product.images.length > 1) ? (
                        <div className="thumbnail-list">
                            {product.images.map((imgObj, index) => (
                                <button
                                    key={index}
                                    className={`thumbnail-btn ${activeImage === index ? 'active' : ''}`}
                                    onClick={() => setActiveImage(index)}
                                >
                                    <img 
                                        src={imgObj.url} 
                                        alt={imgObj.alt || `${product.name} view ${index + 1}`} 
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f1f5f9"/></svg>';
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="thumbnail-list" style={{ display: 'none' }}></div>
                    )}
                </div>

                {/* Product Info */}
                <div className="product-info-column">
                    <div className="product-meta-top">
                        {product.brand && <span className="product-brand">Visit the {product.brand} Store</span>}
                        <span className="product-category-tag">{product.category}</span>
                    </div>
                    
                    <h1 className="details-title">{product.name}</h1>
                    
                    {product.shortDescription && (
                        <p className="product-short-desc">{product.shortDescription}</p>
                    )}

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
                        <span className="price-symbol">₹</span>
                        <span className="current-price">{product.price.toLocaleString()}</span>
                        <div className="price-tax-info">Inclusive of all taxes</div>
                    </div>

                    <div className="product-offers">
                        <div className="offer-box">
                            <span className="offer-title">Bank Offer</span>
                            <span className="offer-desc">Upto ₹1,500.00 discount on select Credit Cards</span>
                        </div>
                        <div className="offer-box">
                            <span className="offer-title">No Cost EMI</span>
                            <span className="offer-desc">Avail No Cost EMI on select cards for orders above ₹3000</span>
                        </div>
                        <div className="offer-box">
                            <span className="offer-title">Partner Offers</span>
                            <span className="offer-desc">Get GST invoice and save up to 28% on business purchases.</span>
                        </div>
                    </div>

                    <div className="trust-badges-row">
                        <div className="trust-badge">
                            <div className="badge-icon">🔄</div>
                            <span>10 days Returnable</span>
                        </div>
                        <div className="trust-badge">
                            <div className="badge-icon">🚚</div>
                            <span>Free Delivery</span>
                        </div>
                        <div className="trust-badge">
                            <div className="badge-icon">🛡️</div>
                            <span>1 Year Warranty</span>
                        </div>
                        <div className="trust-badge">
                            <div className="badge-icon">🏆</div>
                            <span>Top Brand</span>
                        </div>
                    </div>

                    {/* Specifications Table */}
                    {product.specifications && product.specifications.length > 0 && (
                        <div className="product-specifications">
                            <table className="specs-table">
                                <tbody>
                                    {product.specifications.map((spec, idx) => (
                                        <tr key={idx}>
                                            <th className="spec-name">{spec.name}</th>
                                            <td className="spec-value">{spec.value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    
                    {/* About this item (Features) */}
                    {product.features && product.features.length > 0 && (
                        <div className="about-this-item">
                            <h3>About this item</h3>
                            <ul className="feature-bullets">
                                {product.features.map((feature, idx) => (
                                    <li key={idx}>{feature}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    <div className="product-description-section">
                        <h3>Product Description</h3>
                        <p className="product-description">{product.description}</p>
                    </div>
                </div>

                {/* Right Column (Buy Box) */}
                <div className="product-buy-box">
                    <div className="buy-box-price">
                        <span className="price-symbol">₹</span>
                        <span className="current-price">{product.price.toLocaleString()}</span>
                    </div>
                    
                    <div className="delivery-info">
                        <div className="delivery-line">
                            <Truck size={16} color="#007185" />
                            <span><span className="highlight-link">FREE delivery</span> <b>Tomorrow, 11 AM</b></span>
                        </div>
                        <div className="delivery-location">
                            <span className="location-pin">📍</span>
                            <span className="highlight-link">Deliver to Mumbai 400001</span>
                        </div>
                    </div>

                    <div className="stock-status-container" style={{ marginBottom: '1.25rem' }}>
                        {product.availability === 'out_of_stock' && (
                            <span style={{ color: '#B12704', fontSize: '1.125rem', fontWeight: 500 }}>Currently unavailable.</span>
                        )}
                        {product.availability === 'low_stock' && (
                            <span style={{ color: '#B12704', fontSize: '1.125rem', fontWeight: 500 }}>Only a few left in stock - order soon.</span>
                        )}
                        {product.availability === 'in_stock' && (
                            <span style={{ color: '#007600', fontSize: '1.125rem', fontWeight: 500 }}>In stock</span>
                        )}
                    </div>

                    <div className="ships-from-sold-by">
                        <div className="sfsb-row">
                            <span className="sfsb-label">Ships from</span>
                            <span className="sfsb-value">Auralis Fulfillment</span>
                        </div>
                        <div className="sfsb-row">
                            <span className="sfsb-label">Sold by</span>
                            <span className="sfsb-value highlight-link">Auralis Audio India</span>
                        </div>
                    </div>

                    <div className="action-buttons-vertical">
                    
                        <button 
                            className={`amazon-btn add-to-cart-amazon`}
                            onClick={handleAddToCart}
                            disabled={['out_of_stock', 'inactive'].includes(product.availability) || addedToCart}
                        >
                            {addedToCart ? 'Added to Cart ✓' : 'Add to Cart'}
                        </button>
                        <button 
                            className="amazon-btn buy-now-amazon" 
                            onClick={handleBuyNow}
                            disabled={['out_of_stock', 'inactive'].includes(product.availability)}
                        >
                            Buy Now
                        </button>
                    </div>

                    <div className="secure-transaction">
                        <ShieldCheck size={16} color="#999" />
                        <span className="highlight-link">Secure transaction</span>
                    </div>

                    <div className="wishlist-row">
                        <button 
                            className={`add-to-list-btn ${isInWishlist(product.id) ? 'active' : ''}`} 
                            onClick={handleWishlistClick}
                        >
                            {isInWishlist(product.id) ? 'Remove from Wish List' : 'Add to Wish List'}
                        </button>
                    </div>
                </div>
            </div>

            <hr className="amazon-divider" />

            {/* From the manufacturer (A+ Content) */}
            <div className="aplus-content-section">
                <h2 className="amazon-section-title">From the manufacturer</h2>
                
                <div className="aplus-hero-banner">
                    <img 
                        src={product.images && product.images.length > 1 ? product.images[1].url : product.image} 
                        alt="Lifestyle banner" 
                        className="aplus-hero-img"
                    />
                    <div className="aplus-hero-overlay">
                        <h3>Immersive Audio Excellence</h3>
                        <p>{product.shortDescription || 'Experience sound exactly as the artist intended with zero compromise.'}</p>
                    </div>
                </div>
                
                <div className="aplus-grid">
                    <div className="aplus-card">
                        <div className="aplus-card-img-wrapper">
                            <img src={product.images && product.images.length > 2 ? product.images[2].url : product.image} alt="Feature 1" />
                        </div>
                        <h4>Premium Craftsmanship</h4>
                        <p>Designed with meticulous attention to detail using industry-leading materials for lasting comfort and unmatched durability.</p>
                    </div>
                    <div className="aplus-card">
                        <div className="aplus-card-img-wrapper">
                            <img src={product.images && product.images.length > 3 ? product.images[3].url : product.image} alt="Feature 2" />
                        </div>
                        <h4>Acoustic Precision</h4>
                        <p>Engineered to deliver exceptional clarity, deep controlled bass, and an incredibly wide soundstage for true audiophiles.</p>
                    </div>
                    <div className="aplus-card">
                        <div className="aplus-card-img-wrapper">
                            <img src={product.images && product.images.length > 4 ? product.images[4].url : product.image} alt="Feature 3" />
                        </div>
                        <h4>Seamless Integration</h4>
                        <p>Optimized for flawless performance across all your high-resolution audio sources and smart devices.</p>
                    </div>
                </div>
            </div>

            <hr className="amazon-divider" />

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
