import Product from '../models/Product.js';

// @desc    Get all products
// @route   GET /api/v1/products
export const getProducts = async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, sort, ids, availability } = req.query;

        let query = {};

        // Helper to escape regex special characters
        const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // 0. Only active products
        query.isActive = true;

        if (ids) {
            const idArray = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
            if (idArray.length > 0) {
                query.id = { $in: idArray };
            }
        }

        // 1. Search filter (case-insensitive regex on name or description)
        if (search && search.trim() !== '') {
            const cleanSearch = escapeRegex(search.trim());
            query.$or = [
                { name: { $regex: cleanSearch, $options: 'i' } },
                { description: { $regex: cleanSearch, $options: 'i' } }
            ];
        }

        // 2. Category filter
        if (category && category.toLowerCase() !== 'all') {
            const cleanCategory = escapeRegex(category.trim());
            query.category = { $regex: new RegExp(`^${cleanCategory}$`, 'i') };
        }

        // 3. Price filter
        if (minPrice || maxPrice) {
            query.price = {};
            const minNum = Number(minPrice);
            const maxNum = Number(maxPrice);
            if (minPrice && !isNaN(minNum) && minNum >= 0) query.price.$gte = minNum;
            if (maxPrice && !isNaN(maxNum) && maxNum >= 0) query.price.$lte = maxNum;
            if (Object.keys(query.price).length === 0) delete query.price;
        }

        // 3b. Availability filter
        if (availability) {
            if (availability === 'in_stock') {
                query.stockQuantity = { $gt: 0 };
            } else if (availability === 'out_of_stock') {
                query.stockQuantity = 0;
            }
        }

        // 4. Sort
        let sortOption = {};
        switch (sort) {
            case 'price_asc':
            case 'price_low':
                sortOption = { price: 1 };
                break;
            case 'price_desc':
            case 'price_high':
                sortOption = { price: -1 };
                break;
            case 'name_asc':
                sortOption = { name: 1 };
                break;
            case 'name_desc':
                sortOption = { name: -1 };
                break;
            case 'newest':
                sortOption = { createdAt: -1 };
                break;
            case 'relevance':
            default:
                // If there's a search term and we want relevance, we'll sort deterministic for now
                // Alternatively could use MongoDB $text for real relevance but requires text index.
                // We'll stick to a deterministic default (newest + id)
                sortOption = { createdAt: -1, id: 1 }; 
        }

        // 5. Pagination
        const pageNum = Math.max(1, parseInt(req.query.page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(req.query.limit) || 12));
        const skip = (pageNum - 1) * limitNum;

        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Strip internal fields, compute availability state
        const safeProducts = products.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            category: p.category,
            image: p.image,
            description: p.description,
            isBestSeller: p.isBestSeller,
            stockQuantity: p.stockQuantity,
            availability: p.stockQuantity === 0 ? 'out_of_stock' 
                        : (p.stockQuantity <= p.lowStockThreshold ? 'low_stock' : 'in_stock')
        }));

        res.json({
            success: true,
            data: {
                products: safeProducts,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    } catch (error) {
        console.error(`Error in getProducts: ${error.message}`);
        res.status(500).json({
            success: false,
            error: { message: 'Server error retrieving products' }
        });
    }
};

// @desc    Get product by ID
// @route   GET /api/v1/products/:id
export const getProductById = async (req, res) => {
    try {
        // We query by the custom 'id' field, not MongoDB's '_id', and ensure it's active
        const p = await Product.findOne({ id: parseInt(req.params.id), isActive: true }).lean();
        
        if (p) {
            const safeProduct = {
                id: p.id,
                name: p.name,
                price: p.price,
                category: p.category,
                image: p.image,
                images: p.images,
                description: p.description,
                shortDescription: p.shortDescription,
                brand: p.brand,
                specifications: p.specifications,
                features: p.features,
                rating: p.rating,
                numReviews: p.numReviews,
                isBestSeller: p.isBestSeller,
                stockQuantity: p.stockQuantity,
                availability: p.stockQuantity === 0 ? 'out_of_stock' 
                            : (p.stockQuantity <= p.lowStockThreshold ? 'low_stock' : 'in_stock')
            };
            
            res.json({
                success: true,
                data: safeProduct
            });
        } else {
            res.status(404).json({
                success: false,
                error: { message: 'Product not found or unavailable' }
            });
        }
    } catch (error) {
        console.error(`Error in getProductById: ${error.message}`);
        res.status(500).json({
            success: false,
            error: { message: 'Server error retrieving product' }
        });
    }
};

// @desc    Get all categories
// @route   GET /api/v1/categories
export const getCategories = async (req, res) => {
    try {
        // Find unique categories from existing products
        const uniqueCategories = await Product.distinct('category');
        const categoriesData = await Promise.all(
            uniqueCategories.map(async (cat) => {
                const product = await Product.findOne({ category: cat, 'images.0': { $exists: true } }).select('images');
                return {
                    id: cat.toLowerCase(),
                    name: cat,
                    image: product?.images?.[0]?.url || ''
                };
            })
        );

        res.json({
            success: true,
            data: categoriesData
        });
    } catch (error) {
        console.error(`Error in getCategories: ${error.message}`);
        res.status(500).json({
            success: false,
            error: { message: 'Server error retrieving categories' }
        });
    }
};
