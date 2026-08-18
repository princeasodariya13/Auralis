import Coupon from '../models/Coupon.js';
import { recordAdminAction, getChangedFields } from '../services/adminAuditService.js';

// @desc    Get all coupons
// @route   GET /api/v1/admin/coupons
export const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({}).sort({ createdAt: -1 });
        res.json({ success: true, data: coupons });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error retrieving coupons' }});
    }
};

// @desc    Get single coupon
// @route   GET /api/v1/admin/coupons/:id
export const getCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, error: { message: 'Coupon not found' }});
        }
        res.json({ success: true, data: coupon });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error retrieving coupon' }});
    }
};

// @desc    Create new coupon
// @route   POST /api/v1/admin/coupons
export const createCoupon = async (req, res) => {
    try {
        const { code, description, discountType, discountValue, minimumOrderValue, maximumDiscount, startsAt, expiresAt, usageLimit, perUserLimit, isActive } = req.body;

        // Basic validation
        if (!code || !description || !discountType || discountValue === undefined) {
            return res.status(400).json({ success: false, error: { message: 'Please provide all required fields' }});
        }

        if (discountValue < 0) {
            return res.status(400).json({ success: false, error: { message: 'Discount value cannot be negative' }});
        }

        if (discountType === 'percentage' && discountValue > 100) {
            return res.status(400).json({ success: false, error: { message: 'Percentage discount cannot exceed 100' }});
        }

        const normalizedCode = code.trim().toUpperCase();
        
        const existingCoupon = await Coupon.findOne({ code: normalizedCode });
        if (existingCoupon) {
            return res.status(400).json({ success: false, error: { message: 'Coupon code already exists' }});
        }

        if (startsAt && expiresAt && new Date(startsAt) > new Date(expiresAt)) {
             return res.status(400).json({ success: false, error: { message: 'Start date must be before expiration date' }});
        }

        const coupon = await Coupon.create({
            code: normalizedCode,
            description,
            discountType,
            discountValue,
            minimumOrderValue: minimumOrderValue || 0,
            maximumDiscount: maximumDiscount || undefined,
            startsAt: startsAt || Date.now(),
            expiresAt,
            usageLimit: usageLimit || null,
            perUserLimit: perUserLimit || 1,
            isActive: isActive !== undefined ? isActive : true,
            createdBy: req.user._id
        });

        // Audit Log
        await recordAdminAction({
            adminUserId: req.user._id,
            action: 'COUPON_CREATED',
            resourceType: 'Coupon',
            resourceId: coupon._id,
            newState: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                isActive: coupon.isActive
            }
        });

        res.status(201).json({ success: true, data: coupon });

    } catch (error) {
        console.error('Create Coupon Error:', error);
        res.status(500).json({ success: false, error: { message: 'Server error creating coupon' }});
    }
};

// @desc    Update coupon
// @route   PATCH /api/v1/admin/coupons/:id
export const updateCoupon = async (req, res) => {
    try {
        const updates = req.body;
        
        // Prevent modifying code for active tracking safety
        delete updates.code;
        delete updates.usedCount; // Do not allow manual manipulation of usage count

        if (updates.discountValue < 0) {
            return res.status(400).json({ success: false, error: { message: 'Discount value cannot be negative' }});
        }

        if (updates.discountType === 'percentage' && updates.discountValue > 100) {
             return res.status(400).json({ success: false, error: { message: 'Percentage discount cannot exceed 100' }});
        }

        if (updates.startsAt && updates.expiresAt && new Date(updates.startsAt) > new Date(updates.expiresAt)) {
             return res.status(400).json({ success: false, error: { message: 'Start date must be before expiration date' }});
        }

        const oldCoupon = await Coupon.findById(req.params.id);
        if (!oldCoupon) {
            return res.status(404).json({ success: false, error: { message: 'Coupon not found' }});
        }
        
        const oldState = oldCoupon.toObject();

        const coupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        // Audit Log
        const allowedUpdates = ['description', 'discountType', 'discountValue', 'minimumOrderValue', 'maximumDiscount', 'startsAt', 'expiresAt', 'usageLimit', 'perUserLimit', 'isActive'];
        const changes = getChangedFields(oldState, coupon, allowedUpdates);
        
        if (Object.keys(changes.new).length > 0) {
            await recordAdminAction({
                adminUserId: req.user._id,
                action: 'COUPON_UPDATED',
                resourceType: 'Coupon',
                resourceId: coupon._id,
                previousState: changes.previous,
                newState: changes.new
            });
        }

        res.json({ success: true, data: coupon });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error updating coupon' }});
    }
};

// @desc    Delete coupon
// @route   DELETE /api/v1/admin/coupons/:id
export const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, error: { message: 'Coupon not found' }});
        }
        
        await coupon.deleteOne();
        
        // Audit Log
        await recordAdminAction({
            adminUserId: req.user._id,
            action: 'COUPON_DELETED',
            resourceType: 'Coupon',
            resourceId: coupon._id,
            previousState: { code: coupon.code, isActive: coupon.isActive },
            newState: { deleted: true }
        });
        
        res.json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error deleting coupon' }});
    }
};
