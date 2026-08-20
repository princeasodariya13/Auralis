import Product from '../models/Product.js';
import { recordAdminAction, getChangedFields } from '../services/adminAuditService.js';
import { uploadImage, deleteImage } from '../services/cloudinary.service.js';
import fs from 'fs';

// Helper to escape regex
const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Get all products for admin
// @route   GET /api/v1/admin/products
export const getAdminProducts = async (req, res) => {
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

        res.json({
            success: true,
            data: {
                products,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    } catch (error) {
        console.error(`Error in getAdminProducts: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error retrieving admin products' }});
    }
};

// @desc    Get single product for admin
// @route   GET /api/v1/admin/products/:id
export const getAdminProductById = async (req, res) => {
    try {
        const product = await Product.findOne({ id: parseInt(req.params.id) });
        if (!product) {
            return res.status(404).json({ success: false, error: { message: 'Product not found' }});
        }
        res.json({ success: true, data: product });
    } catch (error) {
        console.error(`Error in getAdminProductById: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error retrieving product' }});
    }
};

// @desc    Create new product
// @route   POST /api/v1/admin/products
export const createProduct = async (req, res) => {
    try {
        let { name, price, category, image, description, shortDescription, brand, specifications, features, isBestSeller, stockQuantity, lowStockThreshold, sku, isActive } = req.body;

        // Validation
        if (!name || !name.trim()) return res.status(400).json({ success: false, error: { message: 'Name is required' }});
        if (price === undefined || price < 0 || isNaN(price)) return res.status(400).json({ success: false, error: { message: 'Valid positive price is required' }});
        if (!category || !category.trim()) return res.status(400).json({ success: false, error: { message: 'Category is required' }});
        if (!description || !description.trim()) return res.status(400).json({ success: false, error: { message: 'Description is required' }});
        if (!sku || !sku.trim()) return res.status(400).json({ success: false, error: { message: 'SKU is required' }});
        if (stockQuantity === undefined || stockQuantity < 0 || isNaN(stockQuantity)) return res.status(400).json({ success: false, error: { message: 'Valid non-negative stock quantity is required' }});
        if (lowStockThreshold === undefined || lowStockThreshold < 0 || isNaN(lowStockThreshold)) return res.status(400).json({ success: false, error: { message: 'Valid non-negative low stock threshold is required' }});

        let finalImage = image ? image.trim() : '';
        let imagesArray = [];

        // If a file was uploaded, send to Cloudinary
        if (req.file) {
            try {
                const uploadResult = await uploadImage(req.file.path, 'auralis/products');
                finalImage = uploadResult.url;
                imagesArray.push({
                    publicId: uploadResult.publicId,
                    url: uploadResult.url,
                    alt: name.trim()
                });
                fs.unlinkSync(req.file.path);
            } catch (err) {
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                return res.status(500).json({ success: false, error: { message: 'Failed to upload image to Cloudinary: ' + err.message }});
            }
        }


        // Check SKU uniqueness
        const skuExists = await Product.findOne({ sku: sku.trim() });
        if (skuExists) {
            return res.status(400).json({ success: false, error: { message: 'SKU already exists' }});
        }

        // Generate ID
        const lastProduct = await Product.findOne().sort({ id: -1 });
        const newId = lastProduct ? lastProduct.id + 1 : 1;

        const product = await Product.create({
            id: newId,
            name: name.trim(),
            price: Number(price),
            category: category.trim(),
            image: finalImage,
            images: imagesArray,
            description: description.trim(),
            shortDescription: shortDescription ? shortDescription.trim() : undefined,
            brand: brand && brand !== 'undefined' ? brand.trim() : undefined,
            specifications: specifications && specifications !== 'undefined' ? (Array.isArray(specifications) ? specifications : JSON.parse(specifications)) : [],
            features: features && features !== 'undefined' ? (Array.isArray(features) ? features : JSON.parse(features)) : [],
            isBestSeller: isBestSeller === 'true' || isBestSeller === true,
            stockQuantity: Number(stockQuantity),
            lowStockThreshold: Number(lowStockThreshold),
            sku: sku.trim(),
            isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true
        });

        // Audit Log
        await recordAdminAction({
            adminUserId: req.user._id,
            action: 'PRODUCT_CREATED',
            resourceType: 'Product',
            resourceId: product._id,
            newState: {
                name: product.name,
                price: product.price,
                sku: product.sku,
                stockQuantity: product.stockQuantity
            }
        });

        res.status(201).json({ success: true, data: product });
    } catch (error) {
        console.error(`Error in createProduct:`, error);
        // Handle mongo duplicate key error for SKU in case of race condition
        if (error.code === 11000) {
            return res.status(400).json({ success: false, error: { message: 'Duplicate value exists (likely SKU)' }});
        }
        res.status(500).json({ success: false, error: { message: `Server error creating product: ${error.message}` }});
    }
};

// @desc    Update product
// @route   PATCH /api/v1/admin/products/:id
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ id: parseInt(req.params.id) });

        if (!product) {
            return res.status(404).json({ success: false, error: { message: 'Product not found' }});
        }

        const allowedUpdates = ['name', 'price', 'category', 'image', 'description', 'shortDescription', 'brand', 'specifications', 'features', 'isBestSeller', 'stockQuantity', 'lowStockThreshold', 'sku', 'isActive'];
        const updates = {};
        
        for (const key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                if (key === 'name' || key === 'category' || key === 'image' || key === 'description' || key === 'sku' || key === 'shortDescription' || key === 'brand') {
                    if (typeof req.body[key] === 'string' && req.body[key].trim() === '') {
                        if (key === 'name' || key === 'category' || key === 'description' || key === 'sku') {
                            return res.status(400).json({ success: false, error: { message: `${key} cannot be empty` }});
                        }
                    }
                    updates[key] = req.body[key] ? req.body[key].trim() : undefined;
                } else if (key === 'specifications' || key === 'features') {
                    try {
                        updates[key] = typeof req.body[key] === 'string' ? JSON.parse(req.body[key]) : req.body[key];
                    } catch(e) {
                        updates[key] = [];
                    }
                } else if (key === 'price' || key === 'stockQuantity' || key === 'lowStockThreshold') {
                    const num = Number(req.body[key]);
                    if (isNaN(num) || num < 0) {
                        return res.status(400).json({ success: false, error: { message: `Valid non-negative ${key} is required` }});
                    }
                    updates[key] = num;
                } else if (key === 'isBestSeller' || key === 'isActive') {
                    updates[key] = Boolean(req.body[key] === 'true' || req.body[key] === true);
                }
            }
        }

        // If a new file is provided, upload it and delete the old one
        if (req.file) {
            try {
                const uploadResult = await uploadImage(req.file.path, 'auralis/products');
                updates.image = uploadResult.url;
                updates.images = [{
                    publicId: uploadResult.publicId,
                    url: uploadResult.url,
                    alt: updates.name || product.name
                }];
                fs.unlinkSync(req.file.path);
                
                // Optional: Delete old image from Cloudinary if it exists and has public_id
                if (product.images && product.images.length > 0 && product.images[0].publicId) {
                    await deleteImage(product.images[0].publicId).catch(err => console.error('Failed to delete old image', err));
                }
            } catch (err) {
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                return res.status(500).json({ success: false, error: { message: 'Failed to upload new image to Cloudinary: ' + err.message }});
            }
        }

        if (updates.sku && updates.sku !== product.sku) {
            const skuExists = await Product.findOne({ sku: updates.sku });
            if (skuExists) {
                return res.status(400).json({ success: false, error: { message: 'SKU already exists' }});
            }
        }

        const oldProductState = product.toObject();
        Object.assign(product, updates);
        await product.save();

        // Audit Log
        const changes = getChangedFields(oldProductState, product, allowedUpdates);
        if (Object.keys(changes.new).length > 0) {
            await recordAdminAction({
                adminUserId: req.user._id,
                action: 'PRODUCT_UPDATED',
                resourceType: 'Product',
                resourceId: product._id,
                previousState: changes.previous,
                newState: changes.new
            });
        }

        res.json({ success: true, data: product });
    } catch (error) {
        console.error(`Error in updateProduct: ${error.message}`);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, error: { message: 'Duplicate value exists (likely SKU)' }});
        }
        res.status(500).json({ success: false, error: { message: 'Server error updating product' }});
    }
};

// @desc    Archive/Deactivate product
// @route   DELETE /api/v1/admin/products/:id
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ id: parseInt(req.params.id) });

        if (!product) {
            return res.status(404).json({ success: false, error: { message: 'Product not found' }});
        }

        // Instead of hard delete, we archive/deactivate it to protect orders/wishlist.
        const previousIsActive = product.isActive;
        product.isActive = false;
        await product.save();

        // Audit Log
        if (previousIsActive !== false) {
            await recordAdminAction({
                adminUserId: req.user._id,
                action: 'PRODUCT_DEACTIVATED',
                resourceType: 'Product',
                resourceId: product._id,
                previousState: { isActive: true },
                newState: { isActive: false }
            });
        }

        res.json({ success: true, message: 'Product successfully deactivated/archived' });
    } catch (error) {
        console.error(`Error in deleteProduct: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error deactivating product' }});
    }
};
