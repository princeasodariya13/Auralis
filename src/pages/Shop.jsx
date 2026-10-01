import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useData';
import { productService } from '../services/apiService';
import ProductCard from '../components/ProductCard';
import { 
    Filter, 
    X, 
    Search, 
    ChevronLeft, 
    ChevronRight, 
    ChevronsLeft, 
    ChevronsRight,
    SlidersHorizontal,
    Sparkles,
    CheckCircle2,
    Grid,
    List
} from 'lucide-react';
import { ProductCardSkeleton } from '../components/Skeletons';
import { ErrorState, EmptyState } from '../components/States';
import './Shop.css';

const Shop = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Read from URL initially
    const urlCategory = searchParams.get('category') || 'All';
    const urlSearch = searchParams.get('search') || '';
    const urlMinPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : 0;
    const urlMaxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 10000;
    const urlAvailability = searchParams.get('availability') || 'all';
    const urlSort = searchParams.get('sort') || 'default';
    const urlPage = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
    const urlLimit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 12;

    // Filter States
    const [selectedCategory, setSelectedCategory] = useState(urlCategory);
    const [minPrice, setMinPrice] = useState(urlMinPrice);
    const [maxPrice, setMaxPrice] = useState(urlMaxPrice);
    const [availability, setAvailability] = useState(urlAvailability);
    const [searchInput, setSearchInput] = useState(urlSearch);
    const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
    const [sortOption, setSortOption] = useState(urlSort);
    const [currentPage, setCurrentPage] = useState(urlPage);
    const [itemsPerPage, setItemsPerPage] = useState(urlLimit);
    const [jumpPageInput, setJumpPageInput] = useState('');
    
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [dynamicCategories, setDynamicCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    // Load categories from API (MongoDB-backed)
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const cats = await productService.getCategories();
                setDynamicCategories(cats.map(c => c.name));
            } catch (err) {
                console.error('Failed to load categories', err);
                setDynamicCategories(['Headphones', 'Earphones', 'True Wireless', 'Speakers', 'Microphones', 'DAC & Amplifiers', 'Accessories']);
            } finally {
                setCategoriesLoading(false);
            }
        };
        loadCategories();
    }, []);

    // Debounce Search Input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (debouncedSearch !== searchInput) {
                setDebouncedSearch(searchInput);
                setCurrentPage(1); // Reset to page 1 on new search
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput, debouncedSearch]);

    // Update URL Params when core filters change
    useEffect(() => {
        const params = new URLSearchParams();
        if (selectedCategory !== 'All') params.set('category', selectedCategory);
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (minPrice > 0) params.set('minPrice', minPrice);
        if (maxPrice < 10000) params.set('maxPrice', maxPrice);
        if (availability !== 'all') params.set('availability', availability);
        if (sortOption !== 'default') params.set('sort', sortOption);
        if (itemsPerPage !== 12) params.set('limit', itemsPerPage);
        if (currentPage > 1) params.set('page', currentPage);
        
        setSearchParams(params, { replace: true });
    }, [selectedCategory, debouncedSearch, minPrice, maxPrice, availability, sortOption, itemsPerPage, currentPage, setSearchParams]);

    // Page Handlers
    const handleCategoryChange = (cat) => {
        setSelectedCategory(cat);
        setCurrentPage(1);
        setIsMobileFilterOpen(false);
    };

    const handleMaxPriceChange = (e) => {
        setMaxPrice(Number(e.target.value));
        setCurrentPage(1);
    };

    const handleAvailabilityChange = (val) => {
        setAvailability(val);
        setCurrentPage(1);
    };

    const handleSortChange = (e) => {
        setSortOption(e.target.value);
        setCurrentPage(1);
    };

    const handleLimitChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handlePageChange = (newPage) => {
        if (!pagination) return;
        const targetPage = Math.max(1, Math.min(pagination.totalPages, newPage));
        if (targetPage !== currentPage) {
            setCurrentPage(targetPage);
            window.scrollTo({ top: 120, behavior: 'smooth' });
        }
    };

    const handleJumpSubmit = (e) => {
        e.preventDefault();
        const pageNum = parseInt(jumpPageInput, 10);
        if (!isNaN(pageNum) && pagination) {
            handlePageChange(pageNum);
            setJumpPageInput('');
        }
    };

    const applyPricePreset = (min, max) => {
        setMinPrice(min);
        setMaxPrice(max);
        setCurrentPage(1);
    };

    const getPaginationRange = (current, total) => {
        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }
        const pages = [];
        pages.push(1);

        if (current > 3) {
            pages.push('LEFT_DOTS');
        }

        let start = Math.max(2, current - 1);
        let end = Math.min(total - 1, current + 1);

        if (current <= 3) {
            end = 4;
        } else if (current >= total - 2) {
            start = total - 3;
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (current < total - 2) {
            pages.push('RIGHT_DOTS');
        }

        pages.push(total);
        return pages;
    };

    // Fetch Products
    const { data: products, pagination, loading, error } = useProducts({
        search: debouncedSearch,
        category: selectedCategory,
        minPrice,
        maxPrice,
        availability,
        sort: sortOption,
        page: currentPage,
        limit: itemsPerPage
    });

    const categories = ['All', ...dynamicCategories];

    const handleClearFilters = () => {
        setSelectedCategory('All');
        setMinPrice(0);
        setMaxPrice(10000);
        setAvailability('all');
        setSearchInput('');
        setDebouncedSearch('');
        setSortOption('default');
        setItemsPerPage(12);
        setCurrentPage(1);
    };

    const removeFilter = (type) => {
        if (type === 'category') handleCategoryChange('All');
        if (type === 'search') { setSearchInput(''); setDebouncedSearch(''); setCurrentPage(1); }
        if (type === 'price') { setMinPrice(0); setMaxPrice(10000); setCurrentPage(1); }
        if (type === 'availability') { setAvailability('all'); setCurrentPage(1); }
    };

    const hasActiveFilters = selectedCategory !== 'All' || debouncedSearch !== '' || maxPrice < 10000 || minPrice > 0 || availability !== 'all';

    return (
        <div className="shop-page container section">
            {/* Million-Dollar Hero Header */}
            <div className="shop-hero-banner">
                <div className="shop-hero-badge">
                    <Sparkles size={14} className="text-gold" /> AURALIS MASTER CATALOG
                </div>
                <h1>Explore High-Fidelity Audio</h1>
                <p className="shop-hero-subtitle">
                    Over 2,400+ precision-tuned headphones, wireless earbuds, studio monitors, and audiophile gear.
                </p>
                
                {/* Horizontal Quick Category Bar */}
                <div className="quick-category-pills">
                    {categories.slice(0, 8).map(cat => (
                        <button
                            key={cat}
                            className={`quick-pill ${selectedCategory.toLowerCase() === cat.toLowerCase() ? 'active' : ''}`}
                            onClick={() => handleCategoryChange(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Shop Filter Controls Bar */}
            <div className="shop-header">
                <div className="shop-controls-bar">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by brand, product name, or spec..."
                            aria-label="Search products"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        {searchInput && (
                            <X 
                                size={16} 
                                className="search-clear-icon" 
                                onClick={() => { setSearchInput(''); setDebouncedSearch(''); setCurrentPage(1); }} 
                            />
                        )}
                    </div>
                    
                    <div className="shop-controls-right">
                        {/* Per Page Selector */}
                        <div className="control-select-group">
                            <label htmlFor="limit-select">Show:</label>
                            <select 
                                id="limit-select" 
                                value={itemsPerPage} 
                                onChange={handleLimitChange}
                                className="custom-select"
                            >
                                <option value={12}>12 per page</option>
                                <option value={24}>24 per page</option>
                                <option value={48}>48 per page</option>
                            </select>
                        </div>

                        {/* Sort Selector */}
                        <div className="control-select-group">
                            <label htmlFor="sort">Sort:</label>
                            <select 
                                id="sort" 
                                value={sortOption} 
                                onChange={handleSortChange}
                                className="custom-select"
                            >
                                <option value="default">Featured</option>
                                <option value="newest">Newest Arrivals</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                                <option value="name_asc">Name: A-Z</option>
                                <option value="name_desc">Name: Z-A</option>
                            </select>
                        </div>

                        {/* Mobile Filter Toggle */}
                        <button
                            className="mobile-filter-trigger btn btn-outline"
                            onClick={() => setIsMobileFilterOpen(true)}
                        >
                            <SlidersHorizontal size={16} /> Filters
                        </button>
                    </div>
                </div>

                {/* Active Filter Chips */}
                {hasActiveFilters && (
                    <div className="active-filters">
                        <span className="active-filters-label">Active Filters:</span>
                        {selectedCategory !== 'All' && (
                            <span className="filter-chip">
                                {selectedCategory} <X size={14} onClick={() => removeFilter('category')} />
                            </span>
                        )}
                        {debouncedSearch && (
                            <span className="filter-chip">
                                "{debouncedSearch}" <X size={14} onClick={() => removeFilter('search')} />
                            </span>
                        )}
                        {(minPrice > 0 || maxPrice < 10000) && (
                            <span className="filter-chip">
                                ₹{minPrice} - ₹{maxPrice} <X size={14} onClick={() => removeFilter('price')} />
                            </span>
                        )}
                        {availability !== 'all' && (
                            <span className="filter-chip">
                                {availability === 'in_stock' ? 'In Stock' : 'Out of Stock'} <X size={14} onClick={() => removeFilter('availability')} />
                            </span>
                        )}
                        <button className="clear-all-btn" onClick={handleClearFilters}>
                            Clear All
                        </button>
                    </div>
                )}
            </div>

            <div className="shop-layout">
                {/* Sidebar Filters */}
                <aside className={`shop-sidebar ${isMobileFilterOpen ? 'open' : ''}`}>
                    <div className="sidebar-header mobile-only">
                        <h3>Filter Catalog</h3>
                        <button onClick={() => setIsMobileFilterOpen(false)} aria-label="Close filters">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Category Filter */}
                    <div className="filter-group">
                        <h3>Category</h3>
                        <div className="category-list">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    className={`category-btn ${selectedCategory.toLowerCase() === cat.toLowerCase() ? 'active' : ''}`}
                                    onClick={() => handleCategoryChange(cat)}
                                >
                                    <span>{cat}</span>
                                    {selectedCategory.toLowerCase() === cat.toLowerCase() && (
                                        <CheckCircle2 size={14} className="text-gold" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Availability Filter */}
                    <div className="filter-group">
                        <h3>Availability</h3>
                        <div className="category-list">
                            <button
                                className={`category-btn ${availability === 'all' ? 'active' : ''}`}
                                onClick={() => handleAvailabilityChange('all')}
                            >
                                All Items
                            </button>
                            <button
                                className={`category-btn ${availability === 'in_stock' ? 'active' : ''}`}
                                onClick={() => handleAvailabilityChange('in_stock')}
                            >
                                In Stock Only
                            </button>
                            <button
                                className={`category-btn ${availability === 'out_of_stock' ? 'active' : ''}`}
                                onClick={() => handleAvailabilityChange('out_of_stock')}
                            >
                                Out of Stock
                            </button>
                        </div>
                    </div>

                    {/* Price Filter with Quick Presets */}
                    <div className="filter-group">
                        <h3>Price Range</h3>
                        
                        <div className="price-presets">
                            <button 
                                className={`preset-chip ${minPrice === 0 && maxPrice === 2000 ? 'active' : ''}`}
                                onClick={() => applyPricePreset(0, 2000)}
                            >
                                Under ₹2K
                            </button>
                            <button 
                                className={`preset-chip ${minPrice === 2000 && maxPrice === 5000 ? 'active' : ''}`}
                                onClick={() => applyPricePreset(2000, 5000)}
                            >
                                ₹2K - ₹5K
                            </button>
                            <button 
                                className={`preset-chip ${minPrice === 5000 && maxPrice === 10000 ? 'active' : ''}`}
                                onClick={() => applyPricePreset(5000, 10000)}
                            >
                                ₹5K - ₹10K
                            </button>
                        </div>

                        <div className="price-custom-inputs">
                            <div>
                                <label className="price-input-label" htmlFor="min-price">Min (₹)</label>
                                <input
                                    id="min-price"
                                    type="number"
                                    min="0"
                                    value={minPrice}
                                    onChange={(e) => {
                                        setMinPrice(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="price-num-input"
                                />
                            </div>
                            <span className="price-dash">-</span>
                            <div>
                                <label className="price-input-label" htmlFor="max-price">Max (₹)</label>
                                <input
                                    id="max-price"
                                    type="number"
                                    min="0"
                                    value={maxPrice}
                                    onChange={handleMaxPriceChange}
                                    className="price-num-input"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        className="btn btn-outline full-width clear-sidebar-btn" 
                        onClick={handleClearFilters}
                        disabled={!hasActiveFilters}
                    >
                        Reset All Filters
                    </button>
                </aside>

                {/* Product Grid Main */}
                <main className="shop-grid">
                    {error ? (
                        <ErrorState message={error} onRetry={() => window.location.reload()} />
                    ) : loading ? (
                        <div className="product-grid">
                            {[...Array(itemsPerPage)].map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : products && products.length > 0 ? (
                        <>
                            <div className="catalog-status-bar">
                                <p className="status-count-text">
                                    Showing <strong>{products.length}</strong> of <strong>{pagination?.total || products.length}</strong> items
                                </p>
                                <span className="status-page-badge">
                                    PAGE {currentPage} OF {pagination?.totalPages || 1}
                                </span>
                            </div>
                            
                            <div className="product-grid">
                                {products.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>

                            {/* Luxury Pagination Controls */}
                            {pagination && pagination.totalPages > 1 && (
                                <div className="luxury-pagination-container">
                                    <div className="pagination-nav-group">
                                        {/* First Page Button */}
                                        <button 
                                            className="pagination-btn pagination-nav-btn" 
                                            disabled={currentPage === 1}
                                            onClick={() => handlePageChange(1)}
                                            title="First Page"
                                            aria-label="First Page"
                                        >
                                            <ChevronsLeft size={18} />
                                            <span className="btn-label-desktop">First</span>
                                        </button>

                                        {/* Prev Page Button */}
                                        <button 
                                            className="pagination-btn pagination-nav-btn" 
                                            disabled={currentPage === 1}
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            title="Previous Page"
                                            aria-label="Previous Page"
                                        >
                                            <ChevronLeft size={18} />
                                            <span className="btn-label-desktop">Prev</span>
                                        </button>
                                    </div>

                                    {/* Page Number Pills */}
                                    <div className="pagination-numbers-group">
                                        {getPaginationRange(currentPage, pagination.totalPages).map((page, idx) => {
                                            if (page === 'LEFT_DOTS' || page === 'RIGHT_DOTS') {
                                                return <span key={`dots-${idx}`} className="pagination-ellipsis">&hellip;</span>;
                                            }
                                            return (
                                                <button
                                                    key={page}
                                                    className={`pagination-btn page-number-btn ${currentPage === page ? 'active' : ''}`}
                                                    onClick={() => handlePageChange(page)}
                                                    aria-label={`Page ${page}`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="pagination-nav-group">
                                        {/* Next Page Button */}
                                        <button 
                                            className="pagination-btn pagination-nav-btn" 
                                            disabled={currentPage === pagination.totalPages}
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            title="Next Page"
                                            aria-label="Next Page"
                                        >
                                            <span className="btn-label-desktop">Next</span>
                                            <ChevronRight size={18} />
                                        </button>

                                        {/* Last Page Button */}
                                        <button 
                                            className="pagination-btn pagination-nav-btn" 
                                            disabled={currentPage === pagination.totalPages}
                                            onClick={() => handlePageChange(pagination.totalPages)}
                                            title={`Last Page (${pagination.totalPages})`}
                                            aria-label={`Last Page (${pagination.totalPages})`}
                                        >
                                            <span className="btn-label-desktop">Last</span>
                                            <ChevronsRight size={18} />
                                        </button>
                                    </div>

                                    {/* Direct Jump to Page Form */}
                                    <form className="pagination-jump-form" onSubmit={handleJumpSubmit}>
                                        <span className="jump-label">Page</span>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            max={pagination.totalPages}
                                            value={jumpPageInput}
                                            onChange={(e) => setJumpPageInput(e.target.value)}
                                            placeholder={currentPage}
                                            aria-label="Jump to page"
                                            className="jump-input"
                                        />
                                        <span className="jump-total">of {pagination.totalPages}</span>
                                        <button type="submit" className="jump-btn">Go</button>
                                    </form>
                                </div>
                            )}
                        </>
                    ) : (
                        <EmptyState 
                            message="No products found matching your criteria."
                            actionText="Clear Filters"
                            onAction={handleClearFilters}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

export default Shop;
