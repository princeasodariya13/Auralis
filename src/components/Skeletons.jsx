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

export const ShopSkeleton = () => (
    <div className="container section">
        <div className="skeleton-text skeleton-h1 mb-6" style={{ width: '220px', height: '36px' }}></div>
        <div className="skeleton-filter-bar mb-6">
            <div className="skeleton-pill"></div>
            <div className="skeleton-pill"></div>
            <div className="skeleton-pill"></div>
            <div className="skeleton-pill"></div>
        </div>
        <div className="products-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    </div>
);

export const PageSkeleton = () => (
    <div className="container section page-skeleton-container" style={{ padding: '2rem 1rem' }}>
        <div className="skeleton-text mb-4" style={{ width: '260px', height: '32px', borderRadius: '8px' }}></div>
        <div className="skeleton-text mb-6" style={{ width: '60%', height: '18px', borderRadius: '6px' }}></div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
            {[1, 2, 3, 4, 5, 6].map((idx) => (
                <ProductCardSkeleton key={idx} />
            ))}
        </div>
    </div>
);

export const OrdersSkeleton = () => (
    <div className="container section" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="skeleton-text mb-6" style={{ width: '200px', height: '32px' }}></div>
        {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card mb-4" style={{ height: '140px', padding: '1rem' }}>
                <div className="skeleton-text mb-2" style={{ width: '40%', height: '20px' }}></div>
                <div className="skeleton-text mb-2" style={{ width: '60%', height: '16px' }}></div>
                <div className="skeleton-text" style={{ width: '30%', height: '18px' }}></div>
            </div>
        ))}
    </div>
);
