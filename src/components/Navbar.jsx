import { Link, NavLink, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, Search, User, Heart } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import './Navbar.css';

const Navbar = () => {
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { cartCount } = useCart();
    const { isAuthenticated, user } = useAuth();
    const { wishlist } = useWishlist();

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <nav className="navbar">
            <div className="container nav-container">
                <Link to="/" className="logo">
                    AURALIS
                </Link>

                {/* Desktop Menu */}
                <div className="nav-links desktop-only">
                    <NavLink to="/" className={({ isActive }) => isActive && location.pathname === '/' ? 'active' : ''}>Home</NavLink>
                    <NavLink to="/shop">Shop</NavLink>
                    <NavLink to="/about">About Us</NavLink>
                    <NavLink to="/contact">Contact</NavLink>
                </div>

                <div className="nav-icons">
                    <button className="icon-btn" aria-label="Search">
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
                </div>
            )}
        </nav>
    );
};

export default Navbar;
