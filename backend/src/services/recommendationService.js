import Product from '../models/Product.js';
import Order from '../models/Order.js';

/**
 * Get related products for a given product (same category, different product)
 */
export const getRelatedProductsService = async (productId, category, limit = 4) => {
    // Escape regex
    const cleanCategory = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    return await Product.find({
        id: { $ne: productId },
        isActive: true,
        category: { $regex: new RegExp(`^${cleanCategory}$`, 'i') }
    })
    .select('id name price category image description isBestSeller stockQuantity availability lowStockThreshold')
    .limit(limit)
    .lean();
};

/**
 * Get frequently bought together products
 * Analyzes paid orders that contain the given product and finds co-occurring products
 */
export const getFrequentlyBoughtTogetherService = async (productId, limit = 4) => {
    const pipeline = [
        // 1. Find all paid orders containing this product
        { 
            $match: { 
                paymentStatus: 'paid',
                'items.productId': productId 
            } 
        },
        // 2. Unwind the items array
        { $unwind: "$items" },
        // 3. Filter out the target product itself
        { $match: { 'items.productId': { $ne: productId } } },
        // 4. Group by productId and count co-occurrences
        {
            $group: {
                _id: "$items.productId",
                count: { $sum: 1 }
            }
        },
        // 5. Only include products that co-occur meaningfully (at least once for now)
        { $match: { count: { $gt: 0 } } },
        // 6. Sort by highest frequency
        { $sort: { count: -1 } },
        // 7. Limit results
        { $limit: limit }
    ];

    const coOccurring = await Order.aggregate(pipeline);

    if (coOccurring.length === 0) {
        return [];
    }

    const relatedIds = coOccurring.map(item => item._id);

    // Fetch product details for the related IDs
    const products = await Product.find({
        id: { $in: relatedIds },
        isActive: true
    })
    .select('id name price category image description isBestSeller stockQuantity availability lowStockThreshold')
    .lean();

    // Preserve the sorted order from the aggregation
    const sortedProducts = [];
    relatedIds.forEach(id => {
        const product = products.find(p => p.id === id);
        if (product) {
            sortedProducts.push(product);
        }
    });

    return sortedProducts;
};
