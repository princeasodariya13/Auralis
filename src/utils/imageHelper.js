// Category HD Image Collections (1200p+ High Definition Audio Photography)
const HD_CATEGORY_IMAGES = {
    Headphones: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1590658006821-04f4008d5717?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1577174881658-0f30ed549adc?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=1200&q=85',
    ],
    Speakers: [
        'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=1200&q=85',
    ],
    Earphones: [
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1545127398-14699f92334b?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&q=85',
    ],
    Earbuds: [
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=1200&q=85',
    ],
    Default: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=85',
    ]
};

/**
 * Checks whether an image URL is missing, invalid, or a known placeholder logo (e.g. B&H loading image)
 */
export const isInvalidOrPlaceholderImage = (url) => {
    if (!url || typeof url !== 'string') return true;
    const cleanUrl = url.trim().toLowerCase();
    if (cleanUrl === '' || cleanUrl === 'null' || cleanUrl === 'undefined') return true;

    // Detect known placeholder keywords or broken default graphics
    const placeholderKeywords = [
        'itemimgplaceholder',
        'loading',
        'placeholder',
        'no_image',
        'noimage',
        'default',
        'dummy',
        'smallimages'
    ];

    return placeholderKeywords.some(keyword => cleanUrl.includes(keyword));
};

/**
 * Returns a high-definition 1200p+ image for any product
 */
export const getHDProductImage = (product) => {
    if (product && !isInvalidOrPlaceholderImage(product.image)) {
        return product.image;
    }

    const cat = product?.category || 'Default';
    const id = product?.id || 0;

    let pool = HD_CATEGORY_IMAGES.Default;
    if (cat.toLowerCase().includes('headphone')) {
        pool = HD_CATEGORY_IMAGES.Headphones;
    } else if (cat.toLowerCase().includes('speaker')) {
        pool = HD_CATEGORY_IMAGES.Speakers;
    } else if (cat.toLowerCase().includes('earphone')) {
        pool = HD_CATEGORY_IMAGES.Earphones;
    } else if (cat.toLowerCase().includes('earbud')) {
        pool = HD_CATEGORY_IMAGES.Earbuds;
    }

    const index = Math.abs(id) % pool.length;
    return pool[index];
};

/**
 * Helper to get HD fallback image on onError event
 */
export const handleProductImageError = (e, product) => {
    e.target.onerror = null; // prevent infinite loops
    e.target.src = getHDProductImage({ ...product, image: null });
};
