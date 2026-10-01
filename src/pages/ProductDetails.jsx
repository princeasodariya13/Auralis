import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProduct, useReviews } from '../hooks/useData';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { 
    ShoppingBag, 
    Heart, 
    Truck, 
    ShieldCheck, 
    RotateCcw, 
    Star, 
    ChevronRight, 
    CheckCircle2, 
    Sparkles, 
    Zap, 
    Award, 
    Lock 
} from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { ProductDetailsSkeleton } from '../components/Skeletons';
import { ErrorState, EmptyState } from '../components/States';
import Reviews from '../components/Reviews';
import RecommendationRow from '../components/RecommendationRow';
import { useRecommendations } from '../hooks/useRecommendations';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { formatINR } from '../utils/formatCurrency';
import { getHDProductImage, handleProductImageError, isInvalidOrPlaceholderImage } from '../utils/imageHelper';
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
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (product && !productLoading) {
            addViewedProduct(product.id);
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
                actionText="Explore Audio Catalog" 
                onAction={() => navigate('/shop')} 
            />
        );
    }

    const handleAddToCart = () => {
        addToCart(product);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2200);
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

    const avgRating = reviewsData?.stats?.average || product.rating || 4.5;
    const reviewCount = reviewsData?.stats?.count || product.numReviews || 12;

    const validMainImage = getHDProductImage(product);
    const displayImages = (product.images && product.images.length > 0) 
        ? product.images.map(img => isInvalidOrPlaceholderImage(img?.url) ? { ...img, url: validMainImage } : img) 
        : [{ url: validMainImage, alt: product.name }];

    return (
        <div className="auralis-details-page container">
            {/* Glass Breadcrumbs */}
            <nav className="auralis-breadcrumb">
                <Link to="/" className="breadcrumb-item">Home</Link>
                <ChevronRight size={14} className="breadcrumb-icon" />
                <Link to="/shop" className="breadcrumb-item">Shop</Link>
                <ChevronRight size={14} className="breadcrumb-icon" />
                <Link to={`/shop?category=${product.category}`} className="breadcrumb-item">{product.category}</Link>
                <ChevronRight size={14} className="breadcrumb-icon" />
                <span className="breadcrumb-active">{product.name}</span>
            </nav>

            {/* Main Showcase Grid */}
            <div className="auralis-details-grid">
                
                {/* Left: Gallery & Visual Showcase */}
                <div className="auralis-gallery-card">
                    <div className="main-stage">
                        <img 
                            src={displayImages[activeImage]?.url || validMainImage} 
                            alt={product.name} 
                            className="main-stage-img"
                            fetchPriority="high"
                            onError={(e) => handleProductImageError(e, product)}
                        />

                        {/* Wishlist Button Overlay */}
                        <button 
                            className={`stage-wishlist-btn ${isInWishlist(product.id) ? 'is-active' : ''}`}
                            onClick={handleWishlistClick}
                            aria-label="Add to Wishlist"
                            title={isInWishlist(product.id) ? 'Saved in Wishlist' : 'Add to Wishlist'}
                        >
                            <Heart size={20} fill={isInWishlist(product.id) ? '#EF4444' : 'none'} color={isInWishlist(product.id) ? '#EF4444' : '#64748B'} />
                        </button>

                        {/* Best Seller / Audio Grade Tag */}
                        {product.isBestSeller && (
                            <span className="stage-badge">
                                <Sparkles size={13} /> BESTSELLER
                            </span>
                        )}
                    </div>

                    {/* Thumbnails Showcase */}
                    {displayImages.length > 1 && (
                        <div className="thumb-strip">
                            {displayImages.map((imgObj, idx) => (
                                <button
                                    key={idx}
                                    className={`thumb-box ${activeImage === idx ? 'active-thumb' : ''}`}
                                    onClick={() => setActiveImage(idx)}
                                >
                                    <img 
                                        src={imgObj.url} 
                                        alt={`${product.name} view ${idx + 1}`}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=300&q=80';
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Product Details & Purchase Console */}
                <div className="auralis-console">
                    
                    {/* Header Details */}
                    <div className="console-header">
                        <div className="brand-category-bar">
                            <span className="brand-chip">{product.brand || 'Auralis Audio'}</span>
                            <span className="category-chip">{product.category}</span>
                        </div>

                        <h1 className="product-main-title">{product.name}</h1>

                        {/* Rating Row */}
                        <div className="rating-pills">
                            <div className="stars-wrapper">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star 
                                        key={star} 
                                        size={16} 
                                        fill={star <= Math.round(avgRating) ? "#F59E0B" : "none"} 
                                        color={star <= Math.round(avgRating) ? "#F59E0B" : "#CBD5E1"} 
                                    />
                                ))}
                                <span className="score-val">{avgRating.toFixed(1)}</span>
                            </div>
                            <span className="divider-dot">•</span>
                            <span className="reviews-count-text">{reviewCount} Verified Reviews</span>
                            <span className="divider-dot">•</span>
                            <span className="in-stock-tag">
                                <span className="pulse-dot"></span> In Stock
                            </span>
                        </div>
                    </div>

                    {/* Pricing Display */}
                    <div className="price-card">
                        <div className="price-primary">
                            <span className="price-amount">{formatINR(product.price)}</span>
                            <span className="tax-inclusive">Inclusive of all taxes & free shipping</span>
                        </div>
                    </div>

                    {/* Short Description Summary */}
                    {product.shortDescription && (
                        <p className="console-summary">{product.shortDescription}</p>
                    )}

                    {/* Action CTAs */}
                    <div className="cta-action-group">
                        <button 
                            className={`auralis-cta cta-primary ${addedToCart ? 'added-success' : ''}`}
                            onClick={handleAddToCart}
                            disabled={['out_of_stock', 'inactive'].includes(product.availability) || addedToCart}
                        >
                            <ShoppingBag size={18} />
                            <span>{addedToCart ? 'Added to Bag ✓' : 'Add to Cart'}</span>
                        </button>

                        <button 
                            className="auralis-cta cta-secondary"
                            onClick={handleBuyNow}
                            disabled={['out_of_stock', 'inactive'].includes(product.availability)}
                        >
                            <Zap size={18} />
                            <span>Buy Now</span>
                        </button>
                    </div>

                    {/* Trust Feature Cards */}
                    <div className="trust-features-grid">
                        <div className="trust-card">
                            <div className="trust-icon-box">
                                <Truck size={20} />
                            </div>
                            <div className="trust-card-info">
                                <span className="trust-card-title">Free Express Shipping</span>
                                <span className="trust-card-sub">Delivered in 2-3 Business Days</span>
                            </div>
                        </div>

                        <div className="trust-card">
                            <div className="trust-icon-box">
                                <ShieldCheck size={20} />
                            </div>
                            <div className="trust-card-info">
                                <span className="trust-card-title">1 Year Official Warranty</span>
                                <span className="trust-card-sub">Full Coverage Protection</span>
                            </div>
                        </div>

                        <div className="trust-card">
                            <div className="trust-icon-box">
                                <RotateCcw size={20} />
                            </div>
                            <div className="trust-card-info">
                                <span className="trust-card-title">10 Days Easy Returns</span>
                                <span className="trust-card-sub">Hassle-free Replacements</span>
                            </div>
                        </div>

                        <div className="trust-card">
                            <div className="trust-icon-box">
                                <Lock size={20} />
                            </div>
                            <div className="trust-card-info">
                                <span className="trust-card-title">Secured Checkout</span>
                                <span className="trust-card-sub">256-bit Encrypted Payments</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interactive Tabs Section */}
            <div className="auralis-tabs-wrapper">
                <div className="tabs-header">
                    <button 
                        className={`tab-btn ${activeTab === 'overview' ? 'active-tab' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview & Features
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'specs' ? 'active-tab' : ''}`}
                        onClick={() => setActiveTab('specs')}
                    >
                        Technical Specifications
                    </button>
                </div>

                <div className="tab-content-container">
                    {/* Tab 1: Overview */}
                    {activeTab === 'overview' && (
                        <div className="tab-pane fade-in">
                            <div className="overview-section">
                                <h3 className="section-heading">Audio Engineering Highlights</h3>
                                <p className="overview-description">{product.description}</p>

                                {product.features && product.features.length > 0 && (
                                    <div className="features-grid">
                                        {product.features.map((feature, idx) => (
                                            <div className="feature-card-item" key={idx}>
                                                <CheckCircle2 size={18} className="feature-check-icon" />
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Specs */}
                    {activeTab === 'specs' && (
                        <div className="tab-pane fade-in">
                            <h3 className="section-heading">Hardware & Performance Specifications</h3>
                            {product.specifications && product.specifications.length > 0 ? (
                                <div className="specs-grid-layout">
                                    {product.specifications.map((spec, idx) => (
                                        <div className="spec-tile" key={idx}>
                                            <span className="spec-tile-label">{spec.name}</span>
                                            <span className="spec-tile-value">{spec.value}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-specs-text">Standard Auralis High-Fidelity Audio specifications apply.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Auralis Manufacturer Experience Banner */}
            <div className="auralis-experience-card">
                <div className="experience-media">
                    <img 
                        src={displayImages.length > 1 ? displayImages[1].url : product.image} 
                        alt="Auralis Acoustic Engineering"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=85';
                        }}
                    />
                </div>
                <div className="experience-content">
                    <span className="experience-tag"><Award size={16} /> AURALIS ACOUSTIC LABS</span>
                    <h2>Engineered for Pure Sound Perfection</h2>
                    <p>
                        Every detail of the {product.name} is meticulously tuned by acoustic engineers. 
                        Delivering deep controlled bass, crystal-clear vocal mids, and open spatial highs for an incredible listening journey.
                    </p>
                </div>
            </div>

            {/* Customer Reviews */}
            <div className="auralis-reviews-block">
                {!reviewsLoading && (
                    <Reviews 
                        productId={product.id} 
                        reviewsData={reviewsData} 
                        onReviewChanged={handleReviewChanged}
                    />
                )}
            </div>

            {/* Recommendations */}
            <div className="auralis-recommendations-block">
                <RecommendationRow 
                    title="Frequently Bought Together"
                    products={frequentlyBought}
                    loading={recsLoading}
                />
                
                <RecommendationRow 
                    title="Related Audio Gear"
                    subtitle="Selected for your sound setup"
                    products={related}
                    loading={recsLoading}
                />
            </div>
        </div>
    );
};

export default ProductDetails;
