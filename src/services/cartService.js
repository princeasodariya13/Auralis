import { safeFetch } from './apiService.js';
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api/v1' : 'http://localhost:5000/api/v1');

const getFetchOptions = (method, body) => {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    return options;
};

export const cartService = {
    async getCart() {
        const response = await safeFetch(`${API_URL}/cart`, getFetchOptions('GET'));
        if (response.status === 401) throw new Error('Unauthorized');
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to fetch cart');
        return json.data;
    },

    async addToCart(productId, quantity = 1) {
        const response = await safeFetch(`${API_URL}/cart/items`, getFetchOptions('POST', { productId, quantity }));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to add item');
        return json.data;
    },

    async updateQuantity(productId, quantity) {
        const response = await safeFetch(`${API_URL}/cart/items/${productId}`, getFetchOptions('PATCH', { quantity }));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to update quantity');
        return json.data;
    },

    async removeFromCart(productId) {
        const response = await safeFetch(`${API_URL}/cart/items/${productId}`, getFetchOptions('DELETE'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to remove item');
        return json.data;
    },

    async clearCart() {
        const response = await safeFetch(`${API_URL}/cart`, getFetchOptions('DELETE'));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to clear cart');
        return json.data;
    },

    async mergeCart(guestItems) {
        // guestItems format: [{ id, quantity }]
        const response = await safeFetch(`${API_URL}/cart/merge`, getFetchOptions('POST', { guestItems }));
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json?.error?.message || 'Failed to merge cart');
        return json.data;
    }
};
