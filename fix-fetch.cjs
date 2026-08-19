const fs = require('fs');
const path = require('path');

const fetchHelper = `
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
            // Never expose generic server messages directly if it's a 500, or raw 401/403/404 generic error if we can polish it
            if (response.status === 401 || response.status === 403 || response.status === 404 || response.status === 429 || response.status >= 500) {
                // If it's 401 and backend has a very specific message, maybe use it? 
                // Wait, backend often says "Not authorized to access this route" (mongoose error)
                // We prefer our polished message
                throw new Error(getNetworkErrorMessage(response.status));
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
            throw new Error('We couldn\\'t connect to Auralis. Please check your connection and try again.');
        }
        throw error;
    }
};

const getNetworkErrorMessage = (status) => {
    switch (status) {
        case 401: return 'Your session has expired. Please sign in again.';
        case 403: return 'You don\\'t have permission to access this page.';
        case 404: return 'We couldn\\'t find what you\\'re looking for.';
        case 429: return 'You\\'re doing that a little too quickly. Please wait a moment.';
        case 500:
        case 502:
        case 503:
        case 504: return 'Something went wrong on our side. Please try again.';
        default: return 'An unexpected error occurred. Please try again.';
    }
};
`;

const services = ['apiService.js', 'authService.js', 'cartService.js'];
services.forEach(file => {
    const filePath = path.join('src', 'services', file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if we already patched
    if (content.includes('safeFetch')) {
        console.log('Already patched ' + file);
        return;
    }
    
    content = content.replace(/\bfetch\(/g, 'safeFetch(');
    
    if (file === 'apiService.js') {
        content = fetchHelper + '\n' + content;
    } else {
        content = "import { safeFetch } from './apiService.js';\n" + content;
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + file);
});
