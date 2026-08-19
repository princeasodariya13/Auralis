import { safeFetch } from './apiService.js';
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api/v1' : 'http://localhost:5000/api/v1');

// Fetch options for auth requests to handle credentials
const getFetchOptions = (method, body) => {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Extremely important for cookie-based auth
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    return options;
};

export const authService = {
    async register(name, email, password) {
        const response = await safeFetch(`${API_URL}/auth/register`, getFetchOptions('POST', { name, email, password }));
        const json = await response.json();
        if (!response.ok || !json.success) {
            throw new Error(json?.error?.message || 'Registration failed');
        }
        return json.data.user;
    },

    async login(email, password) {
        const response = await safeFetch(`${API_URL}/auth/login`, getFetchOptions('POST', { email, password }));
        const json = await response.json();
        if (!response.ok || !json.success) {
            throw new Error(json?.error?.message || 'Login failed');
        }
        return json.data.user;
    },

    async logout() {
        const response = await safeFetch(`${API_URL}/auth/logout`, getFetchOptions('POST'));
        const json = await response.json();
        if (!response.ok || !json.success) {
            throw new Error('Logout failed');
        }
        return true;
    },

    async getMe() {
        const response = await safeFetch(`${API_URL}/auth/me`, getFetchOptions('GET'));
        if (response.status === 401) {
            return null; // Not authenticated
        }
        const json = await response.json();
        if (!response.ok || !json.success) {
            return null;
        }
        return json.data.user;
    },

    async updateProfile(name, preferences = undefined) {
        const payload = { name };
        if (preferences !== undefined) {
            payload.preferences = preferences;
        }
        const response = await safeFetch(`${API_URL}/users/me`, getFetchOptions('PATCH', payload));
        const json = await response.json();
        if (!response.ok || !json.success) {
            throw new Error(json?.error?.message || 'Failed to update profile');
        }
        return json.data.user;
    }
};
