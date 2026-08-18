import Product from '../models/Product.js';
import InventoryLog from '../models/InventoryLog.js';
import { sendInventoryAlert } from '../services/notificationService.js';
import { recordAdminAction } from '../services/adminAuditService.js';

// Helper to escape regex
const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Get all inventory records (wraps getAdminProducts for consistency but might tailor)
// @route   GET /api/v1/admin/inventory
export const getInventory = async (req, res) => {
    try {
        const { search, category, status, stockStatus, page, limit } = req.query;
        let query = {};

        // Search
        if (search && search.trim() !== '') {
            const cleanSearch = escapeRegex(search.trim());
            query.$or = [
                { name: { $regex: cleanSearch, $options: 'i' } },
                { sku: { $regex: cleanSearch, $options: 'i' } }
            ];
        }

        // Category
        if (category && category.toLowerCase() !== 'all') {
            query.category = { $regex: new RegExp(`^${escapeRegex(category.trim())}$`, 'i') };
        }

        // Active/Inactive
        if (status === 'active') {
            query.isActive = true;
        } else if (status === 'inactive') {
            query.isActive = false;
        }

        // Stock filter
        if (stockStatus) {
            if (stockStatus === 'in_stock') {
                query.$expr = { $gt: ["$stockQuantity", "$lowStockThreshold"] };
            } else if (stockStatus === 'low_stock') {
                query.$expr = { $lte: ["$stockQuantity", "$lowStockThreshold"] };
                query.stockQuantity = { $gt: 0 };
            } else if (stockStatus === 'out_of_stock') {
                query.stockQuantity = 0;
            }
        }

        // Pagination
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const skip = (pageNum - 1) * limitNum;

        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        // Fetch last inventory log for each product to show "Last Updated"
        const productIds = products.map(p => p.id);
        const latestLogs = await InventoryLog.aggregate([
            { $match: { productId: { $in: productIds } } },
            { $sort: { createdAt: -1 } },
            { $group: { _id: "$productId", lastUpdated: { $first: "$createdAt" } } }
        ]);

        const logMap = latestLogs.reduce((acc, log) => {
            acc[log._id] = log.lastUpdated;
            return acc;
        }, {});

        const mappedProducts = products.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category,
            stockQuantity: p.stockQuantity,
            lowStockThreshold: p.lowStockThreshold,
            isActive: p.isActive,
            image: p.image,
            lastStockUpdate: logMap[p.id] || p.updatedAt
        }));

        res.json({
            success: true,
            data: {
                inventory: mappedProducts,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    } catch (error) {
        console.error(`Error in getInventory: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error retrieving inventory' }});
    }
};

// @desc    Get inventory summary
// @route   GET /api/v1/admin/inventory/summary
export const getInventorySummary = async (req, res) => {
    try {
        const stats = await Product.aggregate([
            {
                $facet: {
                    activeProducts: [
                        { $match: { isActive: true } },
                        { $count: "count" }
                    ],
                    inactiveProducts: [
                        { $match: { isActive: false } },
                        { $count: "count" }
                    ],
                    totalUnits: [
                        { $match: { isActive: true } },
                        { $group: { _id: null, total: { $sum: "$stockQuantity" } } }
                    ],
                    lowStock: [
                        { $match: { 
                            isActive: true, 
                            stockQuantity: { $gt: 0 },
                            $expr: { $lte: ["$stockQuantity", "$lowStockThreshold"] } 
                        } },
                        { $count: "count" }
                    ],
                    outOfStock: [
                        { $match: { isActive: true, stockQuantity: 0 } },
                        { $count: "count" }
                    ]
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                activeProducts: stats[0].activeProducts[0]?.count || 0,
                inactiveProducts: stats[0].inactiveProducts[0]?.count || 0,
                totalUnits: stats[0].totalUnits[0]?.total || 0,
                lowStock: stats[0].lowStock[0]?.count || 0,
                outOfStock: stats[0].outOfStock[0]?.count || 0
            }
        });
    } catch (error) {
        console.error(`Error in getInventorySummary: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error retrieving summary' }});
    }
};

// @desc    Adjust inventory for a product
// @route   POST /api/v1/admin/inventory/:productId/adjust
export const adjustInventory = async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);
        const { adjustmentType, quantity, reason, note } = req.body;
        const adminId = req.user._id; // Enforce server-side user ID

        if (!['stock_in', 'stock_out', 'correction'].includes(adjustmentType)) {
            return res.status(400).json({ success: false, error: { message: 'Invalid adjustment type' }});
        }

        const qty = Number(quantity);
        if (isNaN(qty) || qty < 0 || qty > 100000) {
            return res.status(400).json({ success: false, error: { message: 'Valid quantity between 0 and 100,000 required' }});
        }
        
        if (adjustmentType !== 'correction' && qty === 0) {
            return res.status(400).json({ success: false, error: { message: 'Adjustment quantity must be greater than 0' }});
        }

        if (!reason || !reason.trim()) {
            return res.status(400).json({ success: false, error: { message: 'Reason is required' }});
        }

        // We use findOneAndUpdate with strict conditions to ensure atomic safety
        const product = await Product.findOne({ id: productId });
        if (!product) {
            return res.status(404).json({ success: false, error: { message: 'Product not found' }});
        }

        const previousQuantity = product.stockQuantity;
        let newQuantity = previousQuantity;
        let changeQuantity = 0;

        if (adjustmentType === 'stock_in') {
            newQuantity = previousQuantity + qty;
            changeQuantity = qty;
        } else if (adjustmentType === 'stock_out') {
            if (previousQuantity < qty) {
                return res.status(400).json({ success: false, error: { message: 'Cannot remove more stock than currently available' }});
            }
            newQuantity = previousQuantity - qty;
            changeQuantity = -qty;
        } else if (adjustmentType === 'correction') {
            newQuantity = qty;
            changeQuantity = qty - previousQuantity;
        }

        if (newQuantity < 0) {
             return res.status(400).json({ success: false, error: { message: 'Resulting stock cannot be negative' }});
        }

        // Atomic update checking previous quantity prevents race conditions
        const updatedProduct = await Product.findOneAndUpdate(
            { id: productId, stockQuantity: previousQuantity },
            { $set: { stockQuantity: newQuantity } },
            { new: true }
        );

        if (!updatedProduct) {
            // Document changed in between our read and update
            return res.status(409).json({ success: false, error: { message: 'Concurrent modification detected. Please refresh and try again.' }});
        }

        // Log the inventory change internally
        await InventoryLog.create({
            productId: updatedProduct.id,
            sku: updatedProduct.sku,
            productNameSnapshot: updatedProduct.name,
            adminId,
            adjustmentType,
            changeQuantity,
            previousQuantity,
            newQuantity,
            reason: reason.trim(),
            note: note ? note.trim() : ''
        });

        // Audit Log
        await recordAdminAction({
            adminUserId: adminId,
            action: 'INVENTORY_ADJUSTED',
            resourceType: 'Product',
            resourceId: updatedProduct._id,
            previousState: { stockQuantity: previousQuantity },
            newState: { stockQuantity: newQuantity },
            metadata: {
                adjustmentType,
                changeQuantity,
                reason: reason.trim(),
                note: note ? note.trim() : ''
            }
        });

        // Trigger notifications if needed
        if (updatedProduct.stockQuantity === 0) {
            sendInventoryAlert(updatedProduct, 'out_of_stock').catch(console.error);
        } else if (updatedProduct.stockQuantity <= (updatedProduct.lowStockThreshold || process.env.LOW_STOCK_THRESHOLD || 5)) {
            sendInventoryAlert(updatedProduct, 'low_stock').catch(console.error);
        }

        res.json({
            success: true,
            data: {
                previousQuantity,
                changeQuantity,
                newQuantity: updatedProduct.stockQuantity
            }
        });

    } catch (error) {
        console.error(`Error in adjustInventory: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error adjusting inventory' }});
    }
};

// @desc    Get inventory history for a product
// @route   GET /api/v1/admin/inventory/:productId/history
export const getInventoryHistory = async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const total = await InventoryLog.countDocuments({ productId });
        const history = await InventoryLog.find({ productId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('adminId', 'name email');

        res.json({
            success: true,
            data: {
                history,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error(`Error in getInventoryHistory: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error retrieving history' }});
    }
};
