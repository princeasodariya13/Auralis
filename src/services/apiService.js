import { testimonials } from '../data/mockData';

const API_URL = import.meta.env.PROD ? '/api/v1' : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1');

export const productService = {
    async getProducts(params = {}) {
        // Build query string from params object
        const urlParams = new URLSearchParams();
        
        if (params.search) urlParams.append('search', params.search);
        if (params.category && params.category !== 'All') urlParams.append('category', params.category);
        if (params.minPrice) urlParams.append('minPrice', params.minPrice);
        if (params.maxPrice) urlParams.append('maxPrice', params.maxPrice);
        if (params.sort) urlParams.append('sort', params.sort);
        if (params.page) urlParams.append('page', params.page);
        if (params.limit) urlParams.append('limit', params.limit);

        const queryString = urlParams.toString();
        const endpoint = queryString ? `${API_URL}/products?${queryString}` : `${API_URL}/products`;

        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Failed to fetch products');
        const json = await response.json();
        return json.data;
    },
    
    async getProductById(id) {
        const response = await fetch(`${API_URL}/products/${id}`);
        const json = await response.json();
        if (!response.ok || !json.success) {
            throw new Error(json?.error?.message || 'Product not found');
        }
        return json.data;
    },

    async getRelatedProducts(id, limit = 4) {
        const response = await fetch(`${API_URL}/recommendations/related/${id}?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch related products');
        const json = await response.json();
        return json.data;
    },

    async getFrequentlyBoughtTogether(id, limit = 4) {
        const response = await fetch(`${API_URL}/recommendations/frequently-bought/${id}?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch frequently bought together products');
        const json = await response.json();
        return json.data;
    },

    async getCategories() {
        const response = await fetch(`${API_URL}/categories`);
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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    };
    if (body) options.body = JSON.stringify(body);
    return options;
};

export const wishlistService = {
    async getWishlist() {
        const response = await fetch(`${API_URL}/wishlist`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch wishlist');
        return json.data;
    },
    async addToWishlist(productId) {
        const response = await fetch(`${API_URL}/wishlist/${productId}`, getFetchOptions('POST'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to add to wishlist');
        return json.data;
    },
    async removeFromWishlist(productId) {
        const response = await fetch(`${API_URL}/wishlist/${productId}`, getFetchOptions('DELETE'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to remove from wishlist');
        return json.data;
    },
    async clearWishlist() {
        const response = await fetch(`${API_URL}/wishlist`, getFetchOptions('DELETE'));
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
        const response = await fetch(endpoint, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch reviews');
        return json.data;
    },
    async createReview(productId, reviewData) {
        const response = await fetch(`${API_URL}/products/${productId}/reviews`, getFetchOptions('POST', reviewData));
        const json = await response.json();
        if (!response.ok || !json.success) {
            const error = new Error(json?.error?.message || 'Failed to create review');
            error.response = { data: json };
            throw error;
        }
        return json.data;
    },
    async updateReview(productId, reviewId, reviewData) {
        const response = await fetch(`${API_URL}/products/${productId}/reviews/${reviewId}`, getFetchOptions('PATCH', reviewData));
        const json = await response.json();
        if (!response.ok || !json.success) {
            const error = new Error(json?.error?.message || 'Failed to update review');
            error.response = { data: json };
            throw error;
        }
        return json.data;
    },
    async deleteReview(productId, reviewId) {
        const response = await fetch(`${API_URL}/products/${productId}/reviews/${reviewId}`, getFetchOptions('DELETE'));
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
        const response = await fetch(`${API_URL}/addresses`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch addresses');
        return json.data;
    },
    async createAddress(addressData) {
        const response = await fetch(`${API_URL}/addresses`, getFetchOptions('POST', addressData));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to create address');
        return json.data;
    },
    async updateAddress(id, addressData) {
        const response = await fetch(`${API_URL}/addresses/${id}`, getFetchOptions('PATCH', addressData));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to update address');
        return json.data;
    },
    async deleteAddress(id) {
        const response = await fetch(`${API_URL}/addresses/${id}`, getFetchOptions('DELETE'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to delete address');
        return json.data;
    },
    async setDefaultAddress(id) {
        const response = await fetch(`${API_URL}/addresses/${id}/default`, getFetchOptions('PATCH'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to set default address');
        return json.data;
    }
};

export const orderService = {
    async previewCheckout(couponCode = null) {
        const payload = couponCode ? { couponCode } : {};
        const response = await fetch(`${API_URL}/orders/preview`, getFetchOptions('POST', payload));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to preview checkout');
        return json.data;
    },
    async createOrder(addressId, couponCode = null) {
        const payload = { addressId };
        if (couponCode) payload.couponCode = couponCode;
        const response = await fetch(`${API_URL}/orders`, getFetchOptions('POST', payload));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to create order');
        return json.data;
    },
    async getMyOrders(page = 1, limit = 10) {
        const response = await fetch(`${API_URL}/orders?page=${page}&limit=${limit}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch orders');
        return json.data;
    },
    async getOrderByNumber(orderNumber) {
        const response = await fetch(`${API_URL}/orders/${orderNumber}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch order');
        return json.data;
    },
    async cancelOrder(orderNumber) {
        const response = await fetch(`${API_URL}/orders/${orderNumber}/cancel`, getFetchOptions('POST'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to cancel order');
        return json.data;
    }
};

export const adminService = {
    async getDashboard() {
        const response = await fetch(`${API_URL}/admin/dashboard`, getFetchOptions('GET'));
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

        const response = await fetch(endpoint, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch products');
        return json.data;
    },
    async getProductById(id) {
        const response = await fetch(`${API_URL}/admin/products/${id}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch product');
        return json.data;
    },
    async createProduct(productData) {
        const response = await fetch(`${API_URL}/admin/products`, getFetchOptions('POST', productData));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to create product');
        return json.data;
    },
    async updateProduct(id, productData) {
        const response = await fetch(`${API_URL}/admin/products/${id}`, getFetchOptions('PATCH', productData));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to update product');
        return json.data;
    },
    async deleteProduct(id) {
        const response = await fetch(`${API_URL}/admin/products/${id}`, getFetchOptions('DELETE'));
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

        const response = await fetch(endpoint, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch inventory');
        return json.data;
    },
    async getInventorySummary() {
        const response = await fetch(`${API_URL}/admin/inventory/summary`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch inventory summary');
        return json.data;
    },
    async adjustInventory(productId, adjustmentData) {
        const response = await fetch(`${API_URL}/admin/inventory/${productId}/adjust`, getFetchOptions('POST', adjustmentData));
        const json = await response.json();
        if (!response.ok || !json.success) {
            const error = new Error(json?.error?.message || 'Failed to adjust inventory');
            error.response = { data: json };
            throw error;
        }
        return json.data;
    },
    async getInventoryHistory(productId, page = 1, limit = 10) {
        const response = await fetch(`${API_URL}/admin/inventory/${productId}/history?page=${page}&limit=${limit}`, getFetchOptions('GET'));
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

        const response = await fetch(endpoint, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch orders');
        return json.data;
    },
    async getOrderDetails(orderNumber) {
        const response = await fetch(`${API_URL}/admin/orders/${orderNumber}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch order details');
        return json.data;
    },
    async updateOrderStatus(orderNumber, status) {
        const response = await fetch(`${API_URL}/admin/orders/${orderNumber}/status`, getFetchOptions('PATCH', { status }));
        const json = await response.json();
        if (!response.ok || !json.success) {
            const error = new Error(json?.error?.message || 'Failed to update order status');
            error.response = { data: json };
            throw error;
        }
        return json.data;
    },
    async getOrderHistory(orderNumber, page = 1, limit = 10) {
        const response = await fetch(`${API_URL}/admin/orders/${orderNumber}/history?page=${page}&limit=${limit}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch order history');
        return json.data;
    },
    async getOrderNotes(orderNumber) {
        const response = await fetch(`${API_URL}/admin/orders/${orderNumber}/notes`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch order notes');
        return json.data;
    },
    async addOrderNote(orderNumber, note) {
        const response = await fetch(`${API_URL}/admin/orders/${orderNumber}/notes`, getFetchOptions('POST', { note }));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to add order note');
        return json.data;
    },
    async getCoupons() {
        const response = await fetch(`${API_URL}/admin/coupons`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch coupons');
        return json.data;
    },
    async createCoupon(couponData) {
        const response = await fetch(`${API_URL}/admin/coupons`, getFetchOptions('POST', couponData));
        const json = await response.json();
        if (!response.ok || !json.success) {
            const error = new Error(json?.error?.message || 'Failed to create coupon');
            error.error = json.error;
            throw error;
        }
        return json.data;
    },
    async updateCoupon(id, couponData) {
        const response = await fetch(`${API_URL}/admin/coupons/${id}`, getFetchOptions('PATCH', couponData));
        const json = await response.json();
        if (!response.ok || !json.success) {
            const error = new Error(json?.error?.message || 'Failed to update coupon');
            error.error = json.error;
            throw error;
        }
        return json.data;
    },
    async deleteCoupon(id) {
        const response = await fetch(`${API_URL}/admin/coupons/${id}`, getFetchOptions('DELETE'));
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

        const response = await fetch(endpoint, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch returns');
        return json.data;
    },
    async getReturnDetails(id) {
        const response = await fetch(`${API_URL}/admin/returns/${id}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch return details');
        return json.data;
    },
    async updateReturnStatus(id, payload) {
        const response = await fetch(`${API_URL}/admin/returns/${id}/status`, getFetchOptions('PATCH', payload));
        const json = await response.json();
        if (!response.ok || !json.success) {
            throw new Error(json?.error?.message || 'Failed to update return status');
        }
        return json.data;
    }
};

export const paymentService = {
    async createPaymentOrder(orderNumber) {
        const response = await fetch(`${API_URL}/payments/create-order`, getFetchOptions('POST', { orderNumber }));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to initialize payment');
        return json.data;
    },
    async verifyPayment(paymentData) {
        const response = await fetch(`${API_URL}/payments/verify`, getFetchOptions('POST', paymentData));
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
        const response = await fetch(`${API_URL}/coupons/validate`, getFetchOptions('POST', { couponCode }));
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
        const response = await fetch(`${API_URL}/notifications?page=${page}&limit=${limit}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) {
            throw new Error(json?.error?.message || 'Failed to fetch notifications');
        }
        return json.data;
    },
    async getUnreadCount() {
        const response = await fetch(`${API_URL}/notifications/unread-count`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) return 0;
        return json.data.unreadCount;
    },
    async markAsRead(id) {
        const response = await fetch(`${API_URL}/notifications/${id}/read`, getFetchOptions('PATCH'));
        const json = await response.json();
        if (!response.ok || !json.success) {
            throw new Error(json?.error?.message || 'Failed to mark as read');
        }
        return json.data;
    },
    async markAllAsRead() {
        const response = await fetch(`${API_URL}/notifications/read-all`, getFetchOptions('PATCH'));
        const json = await response.json();
        if (!response.ok || !json.success) {
            throw new Error(json?.error?.message || 'Failed to mark all as read');
        }
        return true;
    }
};

export const returnService = {
    async getEligibility(orderNumber) {
        const response = await fetch(`${API_URL}/returns/eligibility/${orderNumber}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to check eligibility');
        return json.data;
    },
    async createReturnRequest(payload) {
        const response = await fetch(`${API_URL}/returns`, getFetchOptions('POST', payload));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to create return request');
        return json.data;
    },
    async getMyReturns() {
        const response = await fetch(`${API_URL}/returns`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch returns');
        return json.data;
    },
    async getReturnDetails(id) {
        const response = await fetch(`${API_URL}/returns/${id}`, getFetchOptions('GET'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch return details');
        return json.data;
    },
    async cancelReturnRequest(id) {
        const response = await fetch(`${API_URL}/returns/${id}/cancel`, getFetchOptions('PATCH'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to cancel return');
        return json.data;
    }
};
