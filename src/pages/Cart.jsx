import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import './Cart.css';

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, cartTotal, clearCart, isCartLoading } = useCart();

    if (isCartLoading) {
        return (
            <div className="cart-page container section text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="skeleton-btn" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="cart-page container section cart-empty">
                <h1 className="cart-title">Shopping Cart</h1>
                <p>Your cart is waiting for something worth hearing.</p>
                <Link to="/shop" className="btn btn-primary mt-4">
                    Continue Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="cart-page container section">
            <h1 className="cart-title">Shopping Cart</h1>

            <div className="cart-layout">
                {/* Cart Items */}
                <div className="cart-items">
                    <div className="cart-header grid-header mobile-hidden">
                        <span>Product</span>
                        <span>Price</span>
                        <span>Quantity</span>
                        <span>Total</span>
                        <span></span>
                    </div>

                    {cart.map((item) => (
                        <div key={item.id} className="cart-item">
                            <div className="item-product">
                                <Link to={`/product/${item.id}`} className="item-image">
                                    <img src={item.image} alt={item.name} />
                                </Link>
                                <div className="item-details">
                                    <Link to={`/product/${item.id}`} className="item-name">{item.name}</Link>
                                    <span className="item-category">{item.category}</span>
                                </div>
                            </div>

                            <div className="item-price mobile-label" data-label="Price">
                                ₹{item.price.toLocaleString()}
                            </div>

                            <div className="item-quantity mobile-label" data-label="Quantity">
                                <div className="quantity-controls">
                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                        <Minus size={14} />
                                    </button>
                                    <span>{item.quantity}</span>
                                    <button 
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        disabled={item.quantity >= item.stockQuantity || item.availability === 'out_of_stock' || item.availability === 'inactive'}
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                {item.availability === 'low_stock' && (
                                    <span style={{ fontSize: '0.75rem', color: '#d97706', display: 'block', marginTop: '0.25rem' }}>
                                        Only {item.stockQuantity} left
                                    </span>
                                )}
                                {(item.availability === 'out_of_stock' || item.availability === 'inactive') && (
                                    <span style={{ fontSize: '0.75rem', color: '#dc2626', display: 'block', marginTop: '0.25rem' }}>
                                        Unavailable
                                    </span>
                                )}
                            </div>

                            <div className="item-total mobile-label" data-label="Total">
                                ₹{(item.price * item.quantity).toLocaleString()}
                            </div>

                            <div className="item-actions">
                                <button onClick={() => removeFromCart(item.id)} className="remove-btn" aria-label="Remove">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    <div className="cart-actions-row">
                        <button className="btn btn-outline text-sm" onClick={clearCart}>Clear Cart</button>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="cart-summary">
                    <h2>Order Summary</h2>
                    <div className="summary-row">
                        <span>Subtotal</span>
                        <span>₹{cartTotal.toLocaleString()}</span>
                    </div>
                    <div className="summary-row">
                        <span>Shipping</span>
                        <span>Free</span>
                    </div>
                    <div className="summary-total">
                        <span>Total</span>
                        <span>₹{cartTotal.toLocaleString()}</span>
                    </div>
                    <Link to="/checkout" className="btn btn-primary checkout-btn full-width" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                        Proceed to Checkout <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Cart;
