import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, Search, User, Heart, ArrowRight, Sparkles, Volume2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { productService } from '../services/apiService';
import { getHDProductImage, handleProductImageError } from '../utils/imageHelper';
import { formatINR } from '../utils/formatCurrency';
import NotificationBell from './NotificationBell';
import './Navbar.css';

const POPULAR_SEARCHES = ['Headphones', 'Wireless Earbuds', 'Speakers', 'Sony', 'Sennheiser', 'Bose', 'JBL'];

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    
    const { cartCount } = useCart();
    const { isAuthenticated, user } = useAuth();
    const { wishlist } = useWishlist();
    const searchInputRef = useRef(null);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    // Auto focus search input when search overlay opens
    useEffect(() => {
        if (isSearchOpen) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        } else {
            setSearchQuery('');
            setSearchResults([]);
        }
    }, [isSearchOpen]);

    // Handle Escape key to close search overlay
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isSearchOpen) {
                setIsSearchOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSearchOpen]);

    // Debounced Live Search Fetching
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(async () => {
            try {
                const res = await productService.getProducts({ search: searchQuery.trim(), limit: 5 });
                setSearchResults(res.products || []);
            } catch (err) {
                console.error('Navbar search error:', err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Submit full search to Shop page
    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        if (searchQuery.trim()) {
            setIsSearchOpen(false);
            navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleTagClick = (tag) => {
        setIsSearchOpen(false);
        navigate(`/shop?search=${encodeURIComponent(tag)}`);
    };

    const handleProductClick = (productId) => {
        setIsSearchOpen(false);
        navigate(`/product/${productId}`);
    };

    return (
        <>
            <nav className="navbar">
                <div className="container nav-container">
                    <Link to="/" className="logo">
                        <img src="/auralis-logo.png" alt="Auralis Logo" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                    </Link>

                    {/* Desktop Menu */}
                    <div className="nav-links desktop-only">
                        <NavLink to="/" className={({ isActive }) => isActive && location.pathname === '/' ? 'active' : ''}>Home</NavLink>
                        <NavLink to="/shop">Shop</NavLink>
                        <NavLink to="/about">About Us</NavLink>
                        <NavLink to="/contact">Contact</NavLink>
                        {isAuthenticated && user?.role === 'admin' && (
                            <NavLink to="/admin" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Admin Dashboard</NavLink>
                        )}
                    </div>

                    <div className="nav-icons">
                        <NotificationBell />
                        
                        {/* Search Button Trigger */}
                        <button 
                            className="icon-btn" 
                            onClick={() => setIsSearchOpen(true)}
                            aria-label="Search Catalog"
                            title="Search products"
                        >
                            <Search size={22} />
                        </button>

                        <Link to={isAuthenticated ? "/account" : "/login"} className="icon-btn" aria-label={isAuthenticated ? "Account" : "Login"}>
                            <User size={22} color={isAuthenticated ? "var(--color-indigo)" : "currentColor"} />
                        </Link>
                        <Link to="/wishlist" className="icon-btn" aria-label="Wishlist">
                            <Heart size={22} />
                            {wishlist.length > 0 && <span className="cart-badge">{wishlist.length}</span>}
                        </Link>
                        <Link to="/cart" className="icon-btn cart-icon" aria-label="Cart">
                            <ShoppingBag size={22} />
                            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                        </Link>
                        <button className="icon-btn mobile-only" onClick={toggleMenu} aria-label="Menu">
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="mobile-menu">
                        <NavLink to="/" onClick={toggleMenu} className={({ isActive }) => isActive && location.pathname === '/' ? 'active' : ''}>Home</NavLink>
                        <NavLink to="/shop" onClick={toggleMenu}>Shop</NavLink>
                        <NavLink to="/about" onClick={toggleMenu}>About Us</NavLink>
                        <NavLink to="/contact" onClick={toggleMenu}>Contact</NavLink>
                        {isAuthenticated && user?.role === 'admin' && (
                            <NavLink to="/admin" onClick={toggleMenu} style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Admin Dashboard</NavLink>
                        )}
                    </div>
                )}
            </nav>

            {/* Luxury Interactive Search Modal Overlay */}
            {isSearchOpen && (
                <div className="search-overlay" onClick={() => setIsSearchOpen(false)}>
                    <div className="search-modal" onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={handleSearchSubmit} className="search-modal-header">
                            <Search size={22} className="search-modal-icon" />
                            <input 
                                ref={searchInputRef}
                                type="text"
                                className="search-modal-input"
                                placeholder="Search headphones, earbuds, speakers, brands..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button 
                                    type="button" 
                                    className="search-modal-clear"
                                    onClick={() => setSearchQuery('')}
                                >
                                    <X size={18} />
                                </button>
                            )}
                            <button 
                                type="button" 
                                className="search-modal-close"
                                onClick={() => setIsSearchOpen(false)}
                            >
                                <X size={22} />
                            </button>
                        </form>

                        {/* Search Content Body */}
                        <div className="search-modal-body">
                            {/* If input is empty: show Popular Searches */}
                            {!searchQuery.trim() && (
                                <div className="popular-searches-container">
                                    <span className="popular-label">POPULAR SEARCHES</span>
                                    <div className="popular-tags">
                                        {POPULAR_SEARCHES.map(tag => (
                                            <button 
                                                key={tag} 
                                                className="popular-tag-btn"
                                                onClick={() => handleTagClick(tag)}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Loading Spinner */}
                            {isSearching && (
                                <div className="search-loading">
                                    <div className="skeleton-btn" style={{ width: '100%', height: '50px' }}></div>
                                </div>
                            )}

                            {/* Live Results List */}
                            {!isSearching && searchQuery.trim() && searchResults.length > 0 && (
                                <div className="search-results-list">
                                    <div className="search-results-header">
                                        <span>MATCHING AUDIO GEAR</span>
                                    </div>
                                    {searchResults.map(product => (
                                        <div 
                                            key={product.id}
                                            className="search-result-item"
                                            onClick={() => handleProductClick(product.id)}
                                        >
                                            <img 
                                                src={getHDProductImage(product)} 
                                                alt={product.name} 
                                                className="search-result-img"
                                                onError={(e) => handleProductImageError(e, product)}
                                            />
                                            <div className="search-result-info">
                                                <span className="search-result-category">{product.category}</span>
                                                <h4 className="search-result-title">{product.name}</h4>
                                            </div>
                                            <span className="search-result-price">{formatINR(product.price)}</span>
                                        </div>
                                    ))}

                                    <button 
                                        className="btn btn-primary search-view-all-btn"
                                        onClick={handleSearchSubmit}
                                    >
                                        View All Results <ArrowRight size={16} />
                                    </button>
                                </div>
                            )}

                            {/* No Results State */}
                            {!isSearching && searchQuery.trim() && searchResults.length === 0 && (
                                <div className="search-no-results">
                                    <p>No products found for "<strong>{searchQuery}</strong>"</p>
                                    <button 
                                        className="btn btn-outline"
                                        onClick={handleSearchSubmit}
                                    >
                                        Search Catalog in Shop
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;

