import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';
import { wishlistService } from '../services/apiService';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState([]);
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [isWishlistLoading, setIsWishlistLoading] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        const initializeWishlist = async () => {
            if (isAuthenticated) {
                setIsWishlistLoading(true);
                try {
                    const data = await wishlistService.getWishlist();
                    setWishlist(data);
                } catch (error) {
                    console.error("Wishlist init error:", error);
                } finally {
                    setIsWishlistLoading(false);
                }
            } else {
                setWishlist([]);
            }
        };

        initializeWishlist();
    }, [isAuthenticated, authLoading]);

    const addToWishlist = async (productId) => {
        if (!isAuthenticated) return;
        
        // Optimistic update
        const tempItem = { id: productId, isOptimistic: true };
        setWishlist(prev => [...prev, tempItem]);

        try {
            await wishlistService.addToWishlist(productId);
            const data = await wishlistService.getWishlist();
            setWishlist(data);
        } catch (error) {
            // Rollback
            setWishlist(prev => prev.filter(item => item.id !== productId));
            throw error;
        }
    };

    const removeFromWishlist = async (productId) => {
        if (!isAuthenticated) return;

        // Optimistic
        const previousState = [...wishlist];
        setWishlist(prev => prev.filter(item => item.id !== productId));

        try {
            await wishlistService.removeFromWishlist(productId);
        } catch (error) {
            // Rollback
            setWishlist(previousState);
            throw error;
        }
    };

    const toggleWishlist = async (productId) => {
        if (!isAuthenticated) {
            // Let the component handle guest behavior (like redirecting to login)
            return false;
        }
        
        const isWishlisted = wishlist.some(item => item.id === productId);
        if (isWishlisted) {
            await removeFromWishlist(productId);
        } else {
            await addToWishlist(productId);
        }
        return true;
    };

    const isInWishlist = (productId) => {
        return wishlist.some(item => item.id === productId);
    };

    const clearWishlist = async () => {
        if (!isAuthenticated) return;
        try {
            await wishlistService.clearWishlist();
            setWishlist([]);
        } catch (error) {
            console.error("Clear wishlist failed:", error);
            throw error;
        }
    };

    return (
        <WishlistContext.Provider
            value={{
                wishlist,
                addToWishlist,
                removeFromWishlist,
                toggleWishlist,
                isInWishlist,
                clearWishlist,
                isWishlistLoading,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
};

WishlistProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
