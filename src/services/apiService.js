
export const safeFetch = async (url, options = {}) => {
    try {
        const response = await fetch(url, options);
        let json;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            try {
                json = await response.json();
            } catch (e) {
                if (!response.ok) {
                    throw new Error(getNetworkErrorMessage(response.status));
                }
                throw new Error('Received an unexpected response from the server.');
            }
        } else {
            if (!response.ok) {
                throw new Error(getNetworkErrorMessage(response.status));
            }
            json = { success: true }; // Dummy for non-json successes
        }

        if (!response.ok || (json && typeof json.success !== 'undefined' && !json.success)) {
            const backendMessage = json?.error?.message;
            
            // Allow 401s for /auth/me to pass through to the caller (authService.getMe) instead of throwing an error
            if (response.status === 401 && url.includes('/auth/me')) {
                return {
                    ok: false,
                    status: 401,
                    json: async () => json
                };
            }
            
            // For login, we want the specific "Invalid credentials" message, not the generic session expired message
            if (response.status === 401 && url.includes('/auth/login')) {
                throw new Error(backendMessage || 'Invalid credentials');
            }

            // Never expose generic server messages directly if it's a 500, or raw 401/403/404 generic error if we can polish it
            if (response.status === 401 || response.status === 403 || response.status === 404 || response.status === 429) {
                throw new Error(getNetworkErrorMessage(response.status));
            }
            if (response.status >= 500) {
                throw new Error(backendMessage || getNetworkErrorMessage(response.status));
            }
            throw new Error(backendMessage || getNetworkErrorMessage(response.status));
        }
        
        // Mock standard fetch interface for existing code that checks response.ok and calls response.json()
        return {
            ok: response.ok,
            status: response.status,
            json: async () => json
        };
    } catch (error) {
        if (error.name === 'TypeError' || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error('We couldn\'t connect to Auralis. Please check your connection and try again.');
        }
        throw error;
    }
};

const getNetworkErrorMessage = (status) => {
    switch (status) {
        case 401: return 'Unauthorized. Please sign in to continue.';
        case 403: return 'You don\'t have permission to access this page.';
        case 404: return 'We couldn\'t find what you\'re looking for.';
        case 429: return 'You\'re doing that a little too quickly. Please wait a moment.';
        case 500:
        case 502:
        case 503:
        case 504: return 'Something went wrong on our side. Please try again.';
        default: return 'An unexpected error occurred. Please try again.';
    }
};

import { testimonials } from '../data/mockData';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api/v1' : 'http://localhost:5000/api/v1');

export const productService = {
    async getProducts(params = {}) {
        // Build query string from params object
        const urlParams = new URLSearchParams();
        
        if (params.search) urlParams.append('search', params.search);
        if (params.category && params.category !== 'All') urlParams.append('category', params.category);
        if (params.minPrice) urlParams.append('minPrice', params.minPrice);
        if (params.maxPrice) urlParams.append('maxPrice', params.maxPrice);
        if (params.availability && params.availability !== 'all') urlParams.append('availability', params.availability);
        if (params.sort) urlParams.append('sort', params.sort);
        if (params.page) urlParams.append('page', params.page);
        if (params.limit) urlParams.append('limit', params.limit);

        const queryString = urlParams.toString();
        const endpoint = queryString ? `${API_URL}/products?${queryString}` : `${API_URL}/products`;

        const response = await safeFetch(endpoint);
        if (!response.ok) throw new Error('Failed to fetch products');
        const json = await response.json();
        return json.data;
    },
    
    async getProductById(id) {
        const response = await safeFetch(`${API_URL}/products/${id}`);
        const json = await response.json();
        if (!response.ok || !json.success) {
            throw new Error(json?.error?.message || 'Product not found');
        }
        return json.data;
    },

    async getRelatedProducts(id, limit = 4) {
        const response = await safeFetch(`${API_URL}/recommendations/related/${id}?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch related products');
        const json = await response.json();
        return json.data;
    },

    async getFrequentlyBoughtTogether(id, limit = 4) {
        const response = await safeFetch(`${API_URL}/recommendations/frequently-bought/${id}?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch frequently bought together products');
        const json = await response.json();
        return json.data;
    },

    async getCategories() {
        const response = await safeFetch(`${API_URL}/categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        const json = await response.json();
        return json.data;
    },

    async getTestimonials() {
        return testimonials;
    }
};

const getFetchOptions = (method, body) => {
    const options = {
        method,
        credentials: 'include',
    };
    
    const token = localStorage.getItem('token');
    if (token) {
        options.headers = { 'Authorization': `Bearer ${token}` };
    }

    if (body instanceof FormData) {
        options.body = body;
        // Don't set Content-Type header; browser will automatically set it with boundary
    } else if (body) {
        options.headers = { ...options.headers, 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
    }
    return options;
};

export const wishlistService = {
    async getWishlist() {
        const response = await safeFetch(`${API_URL}/wishlist`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch wishlist');
        return json.data;
    },
    async addToWishlist(productId) {
        const response = await safeFetch(`${API_URL}/wishlist/${productId}`, getFetchOptions('POST'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to add to wishlist');
        return json.data;
    },
    async removeFromWishlist(productId) {
        const response = await safeFetch(`${API_URL}/wishlist/${productId}`, getFetchOptions('DELETE'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to remove from wishlist');
        return json.data;
    },
    async clearWishlist() {
        const response = await safeFetch(`${API_URL}/wishlist`, getFetchOptions('DELETE'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to clear wishlist');
        return json.data;
    }
};

export const reviewService = {
    async getReviews(productId, params = {}) {
        let endpoint = `${API_URL}/products/${productId}/reviews`;
        if (params.page || params.limit) {
            const urlParams = new URLSearchParams();
            if (params.page) urlParams.append('page', params.page);
            if (params.limit) urlParams.append('limit', params.limit);
            endpoint += `?${urlParams.toString()}`;
        }
        const response = await safeFetch(endpoint, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch reviews');
        return json.data;
    },
    async createReview(productId, reviewData) {
        const response = await safeFetch(`${API_URL}/products/${productId}/reviews`, getFetchOptions('POST', reviewData));
        const json = await response.json();
        if (!response.ok || !json.success) {
            const error = new Error(json?.error?.message || 'Failed to create review');
            error.response = { data: json };
            throw error;
        }
        return json.data;
    },
    async updateReview(productId, reviewId, reviewData) {
        const response = await safeFetch(`${API_URL}/products/${productId}/reviews/${reviewId}`, getFetchOptions('PATCH', reviewData));
        const json = await response.json();
        if (!response.ok || !json.success) {
            const error = new Error(json?.error?.message || 'Failed to update review');
            error.response = { data: json };
            throw error;
        }
        return json.data;
    },
    async deleteReview(productId, reviewId) {
        // Fallback for older components that might use the old path (although our backend expects /api/v1/reviews/:reviewId for delete)
        const response = await safeFetch(`${API_URL}/reviews/${reviewId}`, getFetchOptions('DELETE'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to delete review');
        return json.data;
    },
    async reportReview(reviewId, reason) {
        const response = await safeFetch(`${API_URL}/reviews/${reviewId}/report`, getFetchOptions('POST', { reason }));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to report review');
        return json.data;
    },
    async voteReview(reviewId, value) {
        const response = await safeFetch(`${API_URL}/reviews/${reviewId}/helpful`, getFetchOptions('POST', { value }));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to vote on review');
        return json.data;
    },
    async adminDeleteReview(reviewId) {
        const response = await safeFetch(`${API_URL}/admin/reviews/${reviewId}`, getFetchOptions('DELETE'));
        const json = await response.json();
        if (!response.ok || !json.success) {
            const error = new Error(json?.error?.message || 'Failed to delete review');
            error.response = { data: json };
            throw error;
        }
        return json.data;
    }
};

export const addressService = {
    async getAddresses() {
        const response = await safeFetch(`${API_URL}/addresses`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch addresses');
        return json.data;
    },
    async createAddress(addressData) {
        const response = await safeFetch(`${API_URL}/addresses`, getFetchOptions('POST', addressData));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to create address');
        return json.data;
    },
    async updateAddress(id, addressData) {
        const response = await safeFetch(`${API_URL}/addresses/${id}`, getFetchOptions('PATCH', addressData));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to update address');
        return json.data;
    },
    async deleteAddress(id) {
        const response = await safeFetch(`${API_URL}/addresses/${id}`, getFetchOptions('DELETE'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to delete address');
        return json.data;
    },
    async setDefaultAddress(id) {
        const response = await safeFetch(`${API_URL}/addresses/${id}/default`, getFetchOptions('PATCH'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to set default address');
        return json.data;
    }
};

export const orderService = {
    async previewCheckout(couponCode = null, pointsToRedeem = 0) {
        const payload = {};
        if (couponCode) payload.couponCode = couponCode;
        if (pointsToRedeem) payload.pointsToRedeem = pointsToRedeem;
        const response = await safeFetch(`${API_URL}/orders/preview`, getFetchOptions('POST', payload));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to preview checkout');
        return json.data;
    },
    async createOrder(addressId, couponCode = null, pointsToRedeem = 0) {
        const payload = { addressId };
        if (couponCode) payload.couponCode = couponCode;
        if (pointsToRedeem) payload.pointsToRedeem = pointsToRedeem;
        const response = await safeFetch(`${API_URL}/orders`, getFetchOptions('POST', payload));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to create order');
        return json.data;
    },
    async getMyOrders(page = 1, limit = 10) {
        const response = await safeFetch(`${API_URL}/orders?page=${page}&limit=${limit}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch orders');
        return json.data;
    },
    async getOrderByNumber(orderNumber) {
        const response = await safeFetch(`${API_URL}/orders/${orderNumber}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch order');
        return json.data;
    },
    async cancelOrder(orderNumber) {
        const response = await safeFetch(`${API_URL}/orders/${orderNumber}/cancel`, getFetchOptions('POST'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to cancel order');
        return json.data;
    },
    async getOrderShipments(orderNumber) {
        const response = await safeFetch(`${API_URL}/orders/${orderNumber}/shipments`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) {
            if (response.status === 404) return []; // No shipments yet
            throw new Error(json?.error?.message || 'Failed to fetch shipments');
        }
        return json.data;
    }
};

export const adminService = {
    async getDashboard() {
        const response = await safeFetch(`${API_URL}/admin/dashboard`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) {
            const error = new Error(json?.error?.message || 'Failed to fetch dashboard');
            error.response = { data: json };
            throw error;
        }
        return json.data;
    },
    async getProducts(params = {}) {
        const urlParams = new URLSearchParams();
        if (params.search) urlParams.append('search', params.search);
        if (params.category && params.category !== 'All') urlParams.append('category', params.category);
        if (params.status) urlParams.append('status', params.status);
        if (params.stockStatus) urlParams.append('stockStatus', params.stockStatus);
        if (params.page) urlParams.append('page', params.page);
        if (params.limit) urlParams.append('limit', params.limit);

        const queryString = urlParams.toString();
        const endpoint = queryString ? `${API_URL}/admin/products?${queryString}` : `${API_URL}/admin/products`;

        const response = await safeFetch(endpoint, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch products');
        return json.data;
    },
    async getProductById(id) {
        const response = await safeFetch(`${API_URL}/admin/products/${id}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch product');
        return json.data;
    },
    async createProduct(productData) {
        const response = await safeFetch(`${API_URL}/admin/products`, getFetchOptions('POST', productData));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to create product');
        return json.data;
    },
    async updateProduct(id, productData) {
        const response = await safeFetch(`${API_URL}/admin/products/${id}`, getFetchOptions('PATCH', productData));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to update product');
        return json.data;
    },
    async deleteProduct(id) {
        const response = await safeFetch(`${API_URL}/admin/products/${id}`, getFetchOptions('DELETE'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to deactivate product');
        return json.data;
    },
    async getInventory(params = {}) {
        const urlParams = new URLSearchParams();
        if (params.search) urlParams.append('search', params.search);
        if (params.category && params.category !== 'All') urlParams.append('category', params.category);
        if (params.status) urlParams.append('status', params.status);
        if (params.stockStatus) urlParams.append('stockStatus', params.stockStatus);
        if (params.page) urlParams.append('page', params.page);
        if (params.limit) urlParams.append('limit', params.limit);

        const queryString = urlParams.toString();
        const endpoint = queryString ? `${API_URL}/admin/inventory?${queryString}` : `${API_URL}/admin/inventory`;

        const response = await safeFetch(endpoint, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch inventory');
        return json.data;
    },
    async getInventorySummary() {
        const response = await safeFetch(`${API_URL}/admin/inventory/summary`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch inventory summary');
        return json.data;
    },
    async adjustInventory(productId, adjustmentData) {
        const response = await safeFetch(`${API_URL}/admin/inventory/${productId}/adjust`, getFetchOptions('POST', adjustmentData));
        const json = await response.json();
        if (!response.ok || !json.success) {
            const error = new Error(json?.error?.message || 'Failed to adjust inventory');
            error.response = { data: json };
            throw error;
        }
        return json.data;
    },
    async getInventoryHistory(productId, page = 1, limit = 10) {
        const response = await safeFetch(`${API_URL}/admin/inventory/${productId}/history?page=${page}&limit=${limit}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch inventory history');
        return json.data;
    },
    async getOrders(params = {}) {
        const urlParams = new URLSearchParams();
        if (params.search) urlParams.append('search', params.search);
        if (params.status && params.status !== 'All') urlParams.append('status', params.status);
        if (params.paymentStatus && params.paymentStatus !== 'All') urlParams.append('paymentStatus', params.paymentStatus);
        if (params.dateFilter) urlParams.append('dateFilter', params.dateFilter);
        if (params.page) urlParams.append('page', params.page);
        if (params.limit) urlParams.append('limit', params.limit);

        const queryString = urlParams.toString();
        const endpoint = queryString ? `${API_URL}/admin/orders?${queryString}` : `${API_URL}/admin/orders`;

        const response = await safeFetch(endpoint, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch orders');
        return json.data;
    },
    async getOrderDetails(orderNumber) {
        const response = await safeFetch(`${API_URL}/admin/orders/${orderNumber}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch order details');
        return json.data;
    },
    async updateOrderStatus(orderNumber, status) {
        const response = await safeFetch(`${API_URL}/admin/orders/${orderNumber}/status`, getFetchOptions('PATCH', { status }));
        const json = await response.json();
        if (!response.ok || !json.success) {
            const error = new Error(json?.error?.message || 'Failed to update order status');
            error.response = { data: json };
            throw error;
        }
        return json.data;
    },
    async getOrderHistory(orderNumber, page = 1, limit = 10) {
        const response = await safeFetch(`${API_URL}/admin/orders/${orderNumber}/history?page=${page}&limit=${limit}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch order history');
        return json.data;
    },
    async getOrderNotes(orderNumber) {
        const response = await safeFetch(`${API_URL}/admin/orders/${orderNumber}/notes`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch order notes');
        return json.data;
    },
    async addNote(orderNumber, note) {
        const response = await safeFetch(`${API_URL}/admin/orders/${orderNumber}/notes`, getFetchOptions('POST', { note }));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to add note');
        return json.data;
    },
    async getShipments(orderNumber) {
        const response = await safeFetch(`${API_URL}/admin/orders/${orderNumber}/shipments`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) {
            if (response.status === 404) return [];
            throw new Error(json?.error?.message || 'Failed to fetch shipments');
        }
        return json.data;
    },
    async createShipment(orderNumber, shipmentData) {
        const response = await safeFetch(`${API_URL}/admin/orders/${orderNumber}/shipments`, getFetchOptions('POST', shipmentData));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to create shipment');
        return json.data;
    },
    async updateShipment(shipmentId, updates) {
        const response = await safeFetch(`${API_URL}/admin/shipments/${shipmentId}`, getFetchOptions('PATCH', updates));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to update shipment');
        return json.data;
    },
    async getShipmentExceptions(params = {}) {
        const urlParams = new URLSearchParams();
        if (params.status && params.status !== 'ALL') urlParams.append('status', params.status);
        if (params.severity && params.severity !== 'ALL') urlParams.append('severity', params.severity);
        if (params.type && params.type !== 'ALL') urlParams.append('type', params.type);
        if (params.page) urlParams.append('page', params.page);
        if (params.limit) urlParams.append('limit', params.limit);

        const queryString = urlParams.toString();
        const endpoint = queryString ? `${API_URL}/admin/shipment-exceptions?${queryString}` : `${API_URL}/admin/shipment-exceptions`;

        const response = await safeFetch(endpoint, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch shipment exceptions');
        return json; // returning full response for pagination
    },
    async getExceptionsSummary() {
        const response = await safeFetch(`${API_URL}/admin/shipment-exceptions/summary`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch exceptions summary');
        return json.data;
    },
    async acknowledgeException(id) {
        const response = await safeFetch(`${API_URL}/admin/shipment-exceptions/${id}/acknowledge`, getFetchOptions('PATCH'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to acknowledge exception');
        return json.data;
    },
    async resolveException(id, resolutionNote) {
        const response = await safeFetch(`${API_URL}/admin/shipment-exceptions/${id}/resolve`, getFetchOptions('PATCH', { resolutionNote }));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to resolve exception');
        return json.data;
    },
    async getCustomers(params = {}) {
        const urlParams = new URLSearchParams();
        if (params.search) urlParams.append('search', params.search);
        if (params.segment && params.segment !== 'ALL') urlParams.append('segment', params.segment);
        if (params.page) urlParams.append('page', params.page);
        if (params.limit) urlParams.append('limit', params.limit);
        if (params.sortField) urlParams.append('sortField', params.sortField);
        if (params.sortOrder) urlParams.append('sortOrder', params.sortOrder);

        const queryString = urlParams.toString();
        const endpoint = queryString ? `${API_URL}/admin/customers?${queryString}` : `${API_URL}/admin/customers`;

        const response = await safeFetch(endpoint, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch customers');
        return json;
    },
    async getCustomerDetails(id) {
        const response = await safeFetch(`${API_URL}/admin/customers/${id}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch customer details');
        return json.data;
    },
    async getCustomerLoyalty(id, page = 1, limit = 20) {
        const response = await safeFetch(`${API_URL}/admin/customers/${id}/loyalty?page=${page}&limit=${limit}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch customer loyalty');
        return json.data;
    },
    async adjustCustomerLoyalty(id, adjustmentData) {
        const response = await safeFetch(`${API_URL}/admin/customers/${id}/loyalty-adjustment`, getFetchOptions('POST', adjustmentData));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to adjust loyalty');
        return json.data;
    },
    async getCoupons() {
        const response = await safeFetch(`${API_URL}/coupons/admin`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch coupons');
        return json.data;
    },
    async createCoupon(couponData) {
        const response = await safeFetch(`${API_URL}/coupons/admin`, getFetchOptions('POST', couponData));
        const json = await response.json();
        if (!response.ok || !json.success) {
            const error = new Error(json?.error?.message || 'Failed to create coupon');
            error.error = json.error;
            throw error;
        }
        return json.data;
    },
    async updateCoupon(id, couponData) {
        const response = await safeFetch(`${API_URL}/coupons/admin/${id}`, getFetchOptions('PATCH', couponData));
        const json = await response.json();
        if (!response.ok || !json.success) {
            const error = new Error(json?.error?.message || 'Failed to update coupon');
            error.error = json.error;
            throw error;
        }
        return json.data;
    },
    async deleteCoupon(id) {
        const response = await safeFetch(`${API_URL}/coupons/admin/${id}`, getFetchOptions('DELETE'));
        const json = await response.json();
        if (!response.ok || !json.success) {
            const error = new Error(json?.error?.message || 'Failed to delete coupon');
            error.error = json.error;
            throw error;
        }
        return json.data;
    },
    async getReturns(params = {}) {
        const urlParams = new URLSearchParams();
        if (params.status && params.status !== 'All') urlParams.append('status', params.status);
        if (params.page) urlParams.append('page', params.page);
        if (params.limit) urlParams.append('limit', params.limit);

        const queryString = urlParams.toString();
        const endpoint = queryString ? `${API_URL}/admin/returns?${queryString}` : `${API_URL}/admin/returns`;

        const response = await safeFetch(endpoint, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch returns');
        return json.data;
    },
    async getReturnDetails(id) {
        const response = await safeFetch(`${API_URL}/admin/returns/${id}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch return details');
        return json.data;
    },
    async updateReturnStatus(id, payload) {
        const response = await safeFetch(`${API_URL}/admin/returns/${id}/status`, getFetchOptions('PATCH', payload));
        const json = await response.json();
        if (!response.ok || !json.success) {
            throw new Error(json?.error?.message || 'Failed to update return status');
        }
        return json.data;
    },
    async getReconciliationSummary() {
        const response = await safeFetch(`${API_URL}/admin/reconciliation/summary`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch reconciliation summary');
        return json.data;
    },
    async getReconciliationAnomalies(params = {}) {
        const urlParams = new URLSearchParams();
        if (params.severity && params.severity !== 'ALL') urlParams.append('severity', params.severity);
        if (params.type && params.type !== 'ALL') urlParams.append('type', params.type);
        if (params.page) urlParams.append('page', params.page);
        if (params.limit) urlParams.append('limit', params.limit);

        const queryString = urlParams.toString();
        const endpoint = queryString ? `${API_URL}/admin/reconciliation/anomalies?${queryString}` : `${API_URL}/admin/reconciliation/anomalies`;

        const response = await safeFetch(endpoint, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch anomalies');
    },
    async getAuditLogs(params = {}) {
        const urlParams = new URLSearchParams();
        if (params.action && params.action !== 'ALL') urlParams.append('action', params.action);
        if (params.resourceType && params.resourceType !== 'ALL') urlParams.append('resourceType', params.resourceType);
        if (params.adminUserId && params.adminUserId !== 'ALL') urlParams.append('adminUserId', params.adminUserId);
        if (params.success !== undefined && params.success !== 'ALL') urlParams.append('success', params.success);
        if (params.page) urlParams.append('page', params.page);
        if (params.limit) urlParams.append('limit', params.limit);

        const queryString = urlParams.toString();
        const endpoint = queryString ? `${API_URL}/admin/audit-logs?${queryString}` : `${API_URL}/admin/audit-logs`;

        const response = await safeFetch(endpoint, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch audit logs');
        return json.data;
    },
    async getAuditFilters() {
        const response = await safeFetch(`${API_URL}/admin/audit-logs/filters`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch audit filters');
        return json.data;
    }
};

export const paymentService = {
    async createPaymentOrder(orderNumber) {
        const response = await safeFetch(`${API_URL}/payments/create-order`, getFetchOptions('POST', { orderNumber }));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to initialize payment');
        return json.data;
    },
    async verifyPayment(paymentData) {
        const response = await safeFetch(`${API_URL}/payments/verify`, getFetchOptions('POST', paymentData));
        const json = await response.json();
        if (!response.ok || !json.success) {
            const err = new Error(json?.error?.message || 'Failed to verify payment');
            err.inventoryIssue = json.inventoryIssue;
            throw err;
        }
        return json;
    }
};

export const couponService = {
    async validateCoupon(couponCode) {
        const response = await safeFetch(`${API_URL}/coupons/validate`, getFetchOptions('POST', { couponCode }));
        const json = await response.json();
        if (!response.ok || !json.success) {
            const error = new Error(json?.error?.message || 'Invalid coupon');
            error.error = json.error;
            throw error;
        }
        return json.data;
    }
};

export const notificationService = {
    async getNotifications(page = 1, limit = 15) {
        const response = await safeFetch(`${API_URL}/notifications?page=${page}&limit=${limit}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) {
            throw new Error(json?.error?.message || 'Failed to fetch notifications');
        }
        return json.data;
    },
    async getUnreadCount() {
        const response = await safeFetch(`${API_URL}/notifications/unread-count`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) return 0;
        return json.data.unreadCount;
    },
    async markAsRead(id) {
        const response = await safeFetch(`${API_URL}/notifications/${id}/read`, getFetchOptions('PATCH'));
        const json = await response.json();
        if (!response.ok || !json.success) {
            throw new Error(json?.error?.message || 'Failed to mark as read');
        }
        return json.data;
    },
    async markAllAsRead() {
        const response = await safeFetch(`${API_URL}/notifications/read-all`, getFetchOptions('PATCH'));
        const json = await response.json();
        if (!response.ok || !json.success) {
            throw new Error(json?.error?.message || 'Failed to mark all as read');
        }
        return true;
    }
};

export const returnService = {
    async getEligibility(orderNumber) {
        const response = await safeFetch(`${API_URL}/returns/eligibility/${orderNumber}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to check eligibility');
        return json.data;
    },
    async createReturnRequest(payload) {
        const response = await safeFetch(`${API_URL}/returns`, getFetchOptions('POST', payload));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to create return request');
        return json.data;
    },
    async getMyReturns() {
        const response = await safeFetch(`${API_URL}/returns`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch returns');
        return json.data;
    },
    async getReturnDetails(id) {
        const response = await safeFetch(`${API_URL}/returns/${id}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch return details');
        return json.data;
    },
    async cancelReturnRequest(id) {
        const response = await safeFetch(`${API_URL}/returns/${id}/cancel`, getFetchOptions('PATCH'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to cancel return');
        return json.data;
    }
};

export const analyticsService = {
    async logEvent(eventType, productId = null) {
        const payload = { eventType };
        if (productId) payload.productId = productId;
        
        // Fire and forget
        safeFetch(`${API_URL}/analytics/events`, getFetchOptions('POST', payload))
            .catch(console.error);
    }
};

export const supportService = {
    async createTicket(payload) {
        const response = await safeFetch(`${API_URL}/support`, getFetchOptions('POST', payload));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to create ticket');
        return json.data;
    },
    async getTickets(page = 1, limit = 10) {
        const response = await safeFetch(`${API_URL}/support?page=${page}&limit=${limit}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch tickets');
        return json.data;
    },
    async getTicketDetails(ticketNumber) {
        const response = await safeFetch(`${API_URL}/support/${ticketNumber}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch ticket details');
        return json.data;
    },
    async replyToTicket(ticketNumber, message) {
        const response = await safeFetch(`${API_URL}/support/${ticketNumber}/messages`, getFetchOptions('POST', { message }));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to reply to ticket');
        return json.data;
    }
};

export const adminSupportService = {
    async getTickets(params = {}) {
        const urlParams = new URLSearchParams();
        if (params.search) urlParams.append('search', params.search);
        if (params.status && params.status !== 'ALL') urlParams.append('status', params.status);
        if (params.priority && params.priority !== 'ALL') urlParams.append('priority', params.priority);
        if (params.category && params.category !== 'ALL') urlParams.append('category', params.category);
        if (params.assignedAdminId) urlParams.append('assignedAdminId', params.assignedAdminId);
        if (params.sort) urlParams.append('sort', params.sort);
        if (params.page) urlParams.append('page', params.page);
        if (params.limit) urlParams.append('limit', params.limit);

        const queryString = urlParams.toString();
        const endpoint = queryString ? `${API_URL}/admin/support?${queryString}` : `${API_URL}/admin/support`;

        const response = await safeFetch(endpoint, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch tickets');
        return json.data;
    },
    async getTicketDetails(ticketNumber) {
        const response = await safeFetch(`${API_URL}/admin/support/${ticketNumber}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch ticket details');
        return json.data;
    },
    async updateTicketStatus(ticketNumber, status) {
        const response = await safeFetch(`${API_URL}/admin/support/${ticketNumber}/status`, getFetchOptions('PATCH', { status }));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to update ticket status');
        return json.data;
    },
    async updateTicketPriority(ticketNumber, priority) {
        const response = await safeFetch(`${API_URL}/admin/support/${ticketNumber}/priority`, getFetchOptions('PATCH', { priority }));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to update ticket priority');
        return json.data;
    },
    async assignTicket(ticketNumber, assignedAdminId) {
        const response = await safeFetch(`${API_URL}/admin/support/${ticketNumber}/assignment`, getFetchOptions('PATCH', { assignedAdminId }));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to assign ticket');
        return json.data;
    },
    async addMessage(ticketNumber, payload) {
        const response = await safeFetch(`${API_URL}/admin/support/${ticketNumber}/messages`, getFetchOptions('POST', payload));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to add message');
        return json.data;
    }
};

export const adminReviewService = {
    async getReviews(params = {}) {
        const urlParams = new URLSearchParams();
        if (params.status && params.status !== 'ALL') urlParams.append('status', params.status);
        if (params.rating && params.rating !== 'ALL') urlParams.append('rating', params.rating);
        if (params.productId) urlParams.append('productId', params.productId);
        if (params.sort) urlParams.append('sort', params.sort);
        if (params.page) urlParams.append('page', params.page);
        if (params.limit) urlParams.append('limit', params.limit);

        const response = await safeFetch(`${API_URL}/admin/reviews?${urlParams.toString()}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch reviews');
        return json.data;
    },
    async updateModeration(reviewId, status) {
        const response = await safeFetch(`${API_URL}/admin/reviews/${reviewId}/moderation`, getFetchOptions('PATCH', { status }));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to update review moderation');
        return json.data;
    },
    async getReports(reviewId) {
        const response = await safeFetch(`${API_URL}/admin/reviews/${reviewId}/reports`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch review reports');
        return json.data;
    }
};

export const loyaltyService = {
    async getMyLoyalty(page = 1, limit = 20) {
        const response = await safeFetch(`${API_URL}/loyalty?page=${page}&limit=${limit}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch loyalty data');
        return json.data;
    }
};
