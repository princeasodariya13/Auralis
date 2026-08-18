import { useState, useEffect } from 'react';
import { productService } from '../services/apiService';

export const useRecommendations = (productId) => {
    const [related, setRelated] = useState(null);
    const [frequentlyBought, setFrequentlyBought] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!productId) return;

        const fetchRecommendations = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // Fetch independently so one failure doesn't block the other
                const [relatedRes, fbtRes] = await Promise.allSettled([
                    productService.getRelatedProducts(productId),
                    productService.getFrequentlyBoughtTogether(productId)
                ]);

                if (relatedRes.status === 'fulfilled' && relatedRes.value?.success) {
                    setRelated(relatedRes.value.data);
                } else {
                    setRelated([]); // Graceful fallback
                }

                if (fbtRes.status === 'fulfilled' && fbtRes.value?.success) {
                    setFrequentlyBought(fbtRes.value.data);
                } else {
                    setFrequentlyBought([]); // Graceful fallback
                }
                
            } catch (err) {
                console.error("Recommendations fetch failed gracefully", err);
                // Don't expose error to UI to avoid blocking product page
                setRelated([]);
                setFrequentlyBought([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [productId]);

    return { related, frequentlyBought, loading, error };
};
