import { useState, useEffect, useCallback } from 'react';

const RECENTLY_VIEWED_KEY = 'auralis_recently_viewed';
const MAX_HISTORY = 10;

export const useRecentlyViewed = () => {
    const [viewedIds, setViewedIds] = useState([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
            if (stored) {
                setViewedIds(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error reading recently viewed from localStorage:', error);
        }
    }, []);

    const addViewedProduct = useCallback((productId) => {
        if (!productId) return;
        
        setViewedIds((prev) => {
            // Remove if already exists to push it to the top
            const filtered = prev.filter(id => id !== productId);
            const updated = [productId, ...filtered].slice(0, MAX_HISTORY);
            
            try {
                localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
            } catch (error) {
                console.error('Error saving recently viewed to localStorage:', error);
            }
            
            return updated;
        });
    }, []);

    const clearRecentlyViewed = useCallback(() => {
        localStorage.removeItem(RECENTLY_VIEWED_KEY);
        setViewedIds([]);
    }, []);

    return {
        viewedIds,
        addViewedProduct,
        clearRecentlyViewed
    };
};
