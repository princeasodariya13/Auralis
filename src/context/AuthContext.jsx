import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { cartService } from '../services/cartService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check auth status on mount
        const checkAuth = async () => {
            try {
                const currentUser = await authService.getMe();
                setUser(currentUser);
            } catch (error) {
                console.error("Auth initialization error", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const handleCartMerge = async () => {
        try {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                const guestItems = JSON.parse(savedCart);
                if (guestItems && guestItems.length > 0) {
                    // Mapping to { id, quantity }
                    const mergePayload = guestItems.map(item => ({ id: item.id, quantity: item.quantity }));
                    await cartService.mergeCart(mergePayload);
                }
                // Clear guest cart ONLY after successful merge
                localStorage.removeItem('cart');
            }
        } catch (error) {
            console.error("Cart merge failed during authentication:", error);
            // Guest cart remains in local storage if merge fails
        }
    };

    const login = async (email, password) => {
        const loggedInUser = await authService.login(email, password);
        await handleCartMerge();
        setUser(loggedInUser);
        return loggedInUser;
    };

    const register = async (name, email, password) => {
        const registeredUser = await authService.register(name, email, password);
        await handleCartMerge();
        setUser(registeredUser);
        return registeredUser;
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    const updateProfile = async (name) => {
        const updatedUser = await authService.updateProfile(name);
        setUser(updatedUser);
        return updatedUser;
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, register, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
