import { useState, useEffect } from 'react';
import { productService, reviewService, addressService, orderService } from '../services/apiService';

export const useProducts = (params = {}) => {
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Stringify to prevent infinite loops if object reference changes
    const paramsString = JSON.stringify(params);

    useEffect(() => {
        let isMounted = true;
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await productService.getProducts(JSON.parse(paramsString));
                if (isMounted) {
                    if (result.products) {
                        setData(result.products);
                        setPagination(result.pagination);
                    } else {
                        setData(result);
                        setPagination(null);
                    }
                }
            } catch (err) {
                if (isMounted) setError(err.message || 'Failed to fetch products');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchProducts();
        return () => { isMounted = false; };
    }, [paramsString]);

    return { data, pagination, loading, error };
};

export const useProduct = (id) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const fetchProduct = async () => {
            if (!id) return;
            try {
                setLoading(true);
                setError(null);
                const result = await productService.getProductById(id);
                if (isMounted) setData(result);
            } catch (err) {
                if (isMounted) setError(err.message || 'Product not found');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchProduct();
        return () => { isMounted = false; };
    }, [id]);

    return { data, loading, error };
};

export const useCategories = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const fetchCategories = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await productService.getCategories();
                if (isMounted) setData(result);
            } catch (err) {
                if (isMounted) setError(err.message || 'Failed to fetch categories');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchCategories();
        return () => { isMounted = false; };
    }, []);

    return { data, loading, error };
};

export const useTestimonials = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const fetchTestimonials = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await productService.getTestimonials();
                if (isMounted) setData(result);
            } catch (err) {
                if (isMounted) setError(err.message || 'Failed to fetch testimonials');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchTestimonials();
        return () => { isMounted = false; };
    }, []);

    return { data, loading, error };
};

export const useReviews = (productId, params = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const paramsString = JSON.stringify(params);

    useEffect(() => {
        let isMounted = true;
        const fetchReviews = async () => {
            if (!productId) return;
            try {
                setLoading(true);
                setError(null);
                const result = await reviewService.getReviews(productId, JSON.parse(paramsString));
                if (isMounted) setData(result);
            } catch (err) {
                if (isMounted) setError(err.message || 'Failed to fetch reviews');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchReviews();
        return () => { isMounted = false; };
    }, [productId, paramsString]);

    return { data, loading, error };
};

export const useAddresses = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await addressService.getAddresses();
            setData(result);
        } catch (err) {
            setError(err.message || 'Failed to fetch addresses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const fetchAndSet = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await addressService.getAddresses();
                if (isMounted) setData(result);
            } catch (err) {
                if (isMounted) setError(err.message || 'Failed to fetch addresses');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchAndSet();
        return () => { isMounted = false; };
    }, []);

    return { data, loading, error, refetch: fetchAddresses };
};

export const useCheckoutPreview = (refreshKey) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const fetchPreview = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await orderService.previewCheckout();
                if (isMounted) setData(result);
            } catch (err) {
                if (isMounted) setError(err.message || 'Failed to generate checkout preview');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchPreview();
        return () => { isMounted = false; };
    }, [refreshKey]);

    return { data, loading, error };
};

export const useOrders = (page = 1, limit = 10) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await orderService.getMyOrders(page, limit);
            setData(result);
        } catch (err) {
            setError(err.message || 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const fetchAndSet = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await orderService.getMyOrders(page, limit);
                if (isMounted) setData(result);
            } catch (err) {
                if (isMounted) setError(err.message || 'Failed to fetch orders');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchAndSet();
        return () => { isMounted = false; };
    }, [page, limit]);

    return { data, loading, error, refetch: fetchOrders };
};

export const useOrder = (orderNumber) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchOrder = async () => {
        if (!orderNumber) return;
        try {
            setLoading(true);
            setError(null);
            const result = await orderService.getOrderByNumber(orderNumber);
            setData(result);
        } catch (err) {
            setError(err.message || 'Order not found');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const fetchAndSet = async () => {
            if (!orderNumber) return;
            try {
                setLoading(true);
                setError(null);
                const result = await orderService.getOrderByNumber(orderNumber);
                if (isMounted) setData(result);
            } catch (err) {
                if (isMounted) setError(err.message || 'Order not found');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchAndSet();
        return () => { isMounted = false; };
    }, [orderNumber]);

    return { data, loading, error, refetch: fetchOrder };
};
