import './Skeletons.css';

export const ProductCardSkeleton = () => (
    <div className="product-card skeleton-card">
        <div className="skeleton-image-container"></div>
        <div className="product-info skeleton-info">
            <div className="skeleton-text skeleton-category"></div>
            <div className="skeleton-text skeleton-title"></div>
            <div className="skeleton-text skeleton-price"></div>
        </div>
    </div>
);

export const ProductDetailsSkeleton = () => (
    <div className="product-details-page container section">
        <div className="skeleton-text skeleton-back-btn mb-4"></div>
        <div className="product-details-grid">
            <div className="product-gallery">
                <div className="skeleton-main-image"></div>
                <div className="thumbnail-list">
                    <div className="skeleton-thumbnail"></div>
                    <div className="skeleton-thumbnail"></div>
                    <div className="skeleton-thumbnail"></div>
                </div>
            </div>
            <div className="product-info-column">
                <div className="skeleton-text skeleton-tag mb-2"></div>
                <div className="skeleton-text skeleton-h1 mb-4"></div>
                <div className="skeleton-text skeleton-rating mb-4"></div>
                <div className="skeleton-text skeleton-h2 mb-4"></div>
                <div className="skeleton-text skeleton-p mb-2"></div>
                <div className="skeleton-text skeleton-p mb-2"></div>
                <div className="skeleton-text skeleton-p mb-6"></div>
                <div className="action-buttons mb-6">
                    <div className="skeleton-btn flex-1"></div>
                    <div className="skeleton-btn flex-1"></div>
                </div>
                <div className="features-list">
                    <div className="skeleton-text skeleton-feature"></div>
                    <div className="skeleton-text skeleton-feature"></div>
                    <div className="skeleton-text skeleton-feature"></div>
                </div>
            </div>
        </div>
    </div>
);
