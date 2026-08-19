import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';
import { cartService } from '../services/cartService';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const { isAuthenticated, user, loading: authLoading } = useAuth();
    const [isCartLoading, setIsCartLoading] = useState(false);

    // Initialize Cart based on Auth state
    useEffect(() => {
        if (authLoading) return;

        const initializeCart = async () => {
            setIsCartLoading(true);
            try {
                if (isAuthenticated) {
                    // Fetch authenticated cart
                    const dbCart = await cartService.getCart();
                    // dbCart.items is [{ id, name, price, image, quantity, subtotal, ... }]
                    // which perfectly matches our frontend `item` structure
                    setCart(dbCart.items || []);
                } else {
                    // Guest cart
                    const savedCart = localStorage.getItem('cart');
                    if (savedCart) {
                        setCart(JSON.parse(savedCart));
                    } else {
                        setCart([]);
                    }
                }
            } catch (error) {
                console.error("Cart init error:", error);
            } finally {
                setIsCartLoading(false);
            }
        };

        initializeCart();
    }, [isAuthenticated, authLoading]);

    // Save Guest cart to local storage whenever it changes (only if NOT authenticated)
    useEffect(() => {
        if (!authLoading && !isAuthenticated && !isCartLoading) {
            localStorage.setItem('cart', JSON.stringify(cart));
        }
    }, [cart, isAuthenticated, authLoading, isCartLoading]);

    const addToCart = async (product) => {
        if (isAuthenticated) {
            try {
                const updatedCart = await cartService.addToCart(product.id, 1);
                setCart(updatedCart.items);
            } catch (err) {
                console.error("Add to cart failed:", err);
                alert(err.message || "We couldn't add this item to your cart right now. Please try again.");
            }
        } else {
            setCart((prevCart) => {
                const existingItem = prevCart.find((item) => item.id === product.id);
                // For guest cart, we can't reliably validate exact stock dynamically without an API call
                if (product.availability === 'out_of_stock' || product.availability === 'inactive') {
                    alert("Sorry, this product is currently unavailable.");
                    return prevCart;
                }

                if (existingItem) {
                    const maxQty = Math.min(existingItem.quantity + 1, 20);
                    if (product.stockQuantity && maxQty > product.stockQuantity) {
                        alert(`Sorry, we only have ${product.stockQuantity} of this item available.`);
                        return prevCart;
                    }
                    return prevCart.map((item) =>
                        item.id === product.id
                            ? { ...item, quantity: maxQty }
                            : item
                    );
                }
                if (product.stockQuantity && 1 > product.stockQuantity) {
                    alert("Sorry, this item is currently out of stock.");
                    return prevCart;
                }
                return [...prevCart, { ...product, quantity: 1 }];
            });
        }
    };

    const removeFromCart = async (productId) => {
        if (isAuthenticated) {
            try {
                const updatedCart = await cartService.removeFromCart(productId);
                setCart(updatedCart.items);
            } catch (err) {
                console.error("Remove from cart failed:", err);
            }
        } else {
            setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
        }
    };

    const updateQuantity = async (productId, newQuantity) => {
        if (newQuantity < 1) return;
        const validQuantity = Math.min(newQuantity, 20);

        if (isAuthenticated) {
            try {
                const updatedCart = await cartService.updateQuantity(productId, validQuantity);
                setCart(updatedCart.items);
            } catch (err) {
                console.error("Update quantity failed:", err);
                alert(err.message || "We couldn't update the quantity right now.");
            }
        } else {
            setCart((prevCart) => {
                const item = prevCart.find(i => i.id === productId);
                if (item && item.stockQuantity && validQuantity > item.stockQuantity) {
                    alert(`Sorry, we only have ${item.stockQuantity} of this item available.`);
                    return prevCart;
                }
                return prevCart.map((item) =>
                    item.id === productId ? { ...item, quantity: validQuantity } : item
                );
            });
        }
    };

    const clearCart = async () => {
        if (isAuthenticated) {
            try {
                const updatedCart = await cartService.clearCart();
                setCart(updatedCart.items);
            } catch (err) {
                console.error("Clear cart failed:", err);
            }
        } else {
            setCart([]);
            localStorage.removeItem('cart');
        }
    };

    // We expose a direct setter for the AuthContext to merge and inject the cart payload immediately
    const setCartDirectly = useCallback((items) => {
        setCart(items);
    }, []);

    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartCount,
                cartTotal,
                isCartLoading,
                setCartDirectly
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

CartProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
