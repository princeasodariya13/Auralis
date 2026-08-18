import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useData';
import ProductCard from '../components/ProductCard';
import { Filter, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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

    // Filter States
    const [selectedCategory, setSelectedCategory] = useState(urlCategory);
    const [minPrice, setMinPrice] = useState(urlMinPrice);
    const [maxPrice, setMaxPrice] = useState(urlMaxPrice);
    const [availability, setAvailability] = useState(urlAvailability);
    const [searchInput, setSearchInput] = useState(urlSearch);
    const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
    const [sortOption, setSortOption] = useState(urlSort);
    const [currentPage, setCurrentPage] = useState(urlPage);
    
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // Debounce Search Input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (debouncedSearch !== searchInput) {
                setDebouncedSearch(searchInput);
                setCurrentPage(1); // Reset to page 1 on new search
            }
        }, 500);
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
        if (currentPage > 1) params.set('page', currentPage);
        
        setSearchParams(params, { replace: true });
    }, [selectedCategory, debouncedSearch, minPrice, maxPrice, availability, sortOption, currentPage, setSearchParams]);

    // Reset page to 1 if category, price, or sort changes
    const handleCategoryChange = (cat) => {
        setSelectedCategory(cat);
        setCurrentPage(1);
        setIsMobileFilterOpen(false);
    };

    const handleMaxPriceChange = (e) => {
        setMaxPrice(Number(e.target.value));
        setCurrentPage(1);
    };

    const handleAvailabilityChange = (e) => {
        setAvailability(e.target.value);
        setCurrentPage(1);
    };

    const handleSortChange = (e) => {
        setSortOption(e.target.value);
        setCurrentPage(1);
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
        limit: 12
    });

    const categories = ['All', 'Headphones', 'Speakers', 'Accessories'];

    const handleClearFilters = () => {
        setSelectedCategory('All');
        setMinPrice(0);
        setMaxPrice(10000);
        setAvailability('all');
        setSearchInput('');
        setDebouncedSearch('');
        setSortOption('default');
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
            <div className="shop-header">
                <div className="shop-header-top">
                    <h1>Shop Gear</h1>
                    <button
                        className="mobile-filter-btn btn btn-outline"
                        onClick={() => setIsMobileFilterOpen(true)}
                    >
                        <Filter size={18} /> Filters
                    </button>
                </div>

                <div className="shop-controls">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            aria-label="Search products"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </div>
                    
                    <div className="sort-wrapper">
                        <label htmlFor="sort">Sort by:</label>
                        <select 
                            id="sort" 
                            value={sortOption} 
                            onChange={handleSortChange}
                        >
                            <option value="default">Featured</option>
                            <option value="newest">Newest Arrivals</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="name_asc">Name: A-Z</option>
                            <option value="name_desc">Name: Z-A</option>
                        </select>
                    </div>
                </div>

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
                                ${minPrice} - ${maxPrice} <X size={14} onClick={() => removeFilter('price')} />
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
                        <h3>Filters</h3>
                        <button onClick={() => setIsMobileFilterOpen(false)} aria-label="Close filters">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="filter-group">
                        <h3>Category</h3>
                        <div className="category-list">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    className={`category-btn ${selectedCategory.toLowerCase() === cat.toLowerCase() ? 'active' : ''}`}
                                    onClick={() => handleCategoryChange(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-group">
                        <h3>Availability</h3>
                        <div className="category-list">
                            <button
                                className={`category-btn ${availability === 'all' ? 'active' : ''}`}
                                onClick={() => handleAvailabilityChange({ target: { value: 'all' }})}
                            >
                                Any Availability
                            </button>
                            <button
                                className={`category-btn ${availability === 'in_stock' ? 'active' : ''}`}
                                onClick={() => handleAvailabilityChange({ target: { value: 'in_stock' }})}
                            >
                                In Stock
                            </button>
                            <button
                                className={`category-btn ${availability === 'out_of_stock' ? 'active' : ''}`}
                                onClick={() => handleAvailabilityChange({ target: { value: 'out_of_stock' }})}
                            >
                                Out of Stock
                            </button>
                        </div>
                    </div>

                    <div className="filter-group">
                        <h3>Price Range</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <label className="text-sm text-muted" htmlFor="min-price">Min ($)</label>
                                <input
                                    id="min-price"
                                    type="number"
                                    min="0"
                                    value={minPrice}
                                    onChange={(e) => {
                                        setMinPrice(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="price-input"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-slate-700)', backgroundColor: 'var(--color-slate-800)', color: 'var(--color-slate-100)' }}
                                />
                            </div>
                            <span style={{ marginTop: '1.5rem' }}>-</span>
                            <div style={{ flex: 1 }}>
                                <label className="text-sm text-muted" htmlFor="max-price">Max ($)</label>
                                <input
                                    id="max-price"
                                    type="number"
                                    min="0"
                                    value={maxPrice}
                                    onChange={handleMaxPriceChange}
                                    className="price-input"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-slate-700)', backgroundColor: 'var(--color-slate-800)', color: 'var(--color-slate-100)' }}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        className="btn btn-outline full-width" 
                        onClick={handleClearFilters}
                        disabled={!hasActiveFilters}
                    >
                        Clear Filters
                    </button>
                </aside>

                {/* Product Grid */}
                <main className="shop-grid">
                    {error ? (
                        <ErrorState message={error} onRetry={() => window.location.reload()} />
                    ) : loading ? (
                        <div className="product-grid">
                            {[...Array(6)].map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : products && products.length > 0 ? (
                        <>
                            <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
                                Showing {products.length} product{products.length !== 1 ? 's' : ''} {pagination?.total > 0 && `of ${pagination.total}`}
                            </p>
                            
                            <div className="product-grid">
                                {products.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            {pagination && pagination.totalPages > 1 && (
                                <div className="pagination-controls">
                                    <button 
                                        className="btn btn-outline" 
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                    >
                                        <ChevronLeft size={18} /> Prev
                                    </button>
                                    <span className="pagination-info">
                                        Page {currentPage} of {pagination.totalPages}
                                    </span>
                                    <button 
                                        className="btn btn-outline" 
                                        disabled={currentPage === pagination.totalPages}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                    >
                                        Next <ChevronRight size={18} />
                                    </button>
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
