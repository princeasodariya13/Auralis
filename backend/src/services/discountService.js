import Coupon from '../models/Coupon.js';
import CouponUsage from '../models/CouponUsage.js';
import { getAvailablePoints, calculateLoyaltyDiscount } from './loyaltyService.js';

// Calculate Shipping
export const calculateShipping = (subtotal, discountAmount = 0) => {
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    return discountedSubtotal >= 200 ? 0 : 15.00;
};

// Calculate Tax
export const calculateTax = (subtotal, discountAmount = 0) => {
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    return Number((discountedSubtotal * 0.08).toFixed(2));
};

// Calculate Final Checkout Totals with optional Coupon and Loyalty Points
export const calculateCheckoutTotals = async (subtotal, couponCode, userId, pointsToRedeem = 0, session = null) => {
    let discountAmount = 0;
    let coupon = null;

    if (couponCode) {
        // 1. Normalize code
        const normalizedCode = couponCode.trim().toUpperCase();
        
        // 2. Fetch coupon
        coupon = await Coupon.findOne({ code: normalizedCode });
        
        if (!coupon) {
            throw new Error('Invalid coupon code');
        }

        // 3. Validation Rules
        if (!coupon.isActive) {
            throw new Error('Coupon is inactive');
        }
        
        const now = new Date();
        if (coupon.startsAt && now < coupon.startsAt) {
            throw new Error('Coupon is not yet active');
        }
        
        if (coupon.expiresAt && now > coupon.expiresAt) {
            throw new Error('Coupon has expired');
        }
        
        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
            throw new Error('Coupon usage limit reached');
        }
        
        if (subtotal < coupon.minimumOrderValue) {
            throw new Error(`Minimum order value of $${coupon.minimumOrderValue} not met`);
        }

        if (userId) {
            const userUsageCount = await CouponUsage.countDocuments({ couponId: coupon._id, userId });
            if (userUsageCount >= coupon.perUserLimit) {
                throw new Error('You have already reached the usage limit for this coupon');
            }
        }

        // 4. Calculate Discount
        if (coupon.discountType === 'fixed') {
            discountAmount = coupon.discountValue;
        } else if (coupon.discountType === 'percentage') {
            discountAmount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) {
                discountAmount = coupon.maximumDiscount;
            }
        }
        
        // Prevent discount from exceeding subtotal
        discountAmount = Math.min(discountAmount, subtotal);
        discountAmount = Number(discountAmount.toFixed(2));
        discountAmount = Number(discountAmount.toFixed(2));
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    
    let loyaltyDiscount = 0;
    let loyaltyPointsRedeemed = 0;
    
    if (pointsToRedeem > 0 && userId) {
        const availablePoints = await getAvailablePoints(userId, session);
        const actualPointsToUse = Math.min(pointsToRedeem, availablePoints);
        
        const loyaltyCalc = calculateLoyaltyDiscount(discountedSubtotal, actualPointsToUse);
        loyaltyDiscount = loyaltyCalc.discountAmount;
        loyaltyPointsRedeemed = loyaltyCalc.pointsUsed;
    }

    const finalSubtotal = Math.max(0, discountedSubtotal - loyaltyDiscount);
    const totalDiscount = discountAmount + loyaltyDiscount;

    const shippingCost = calculateShipping(subtotal, totalDiscount);
    const tax = calculateTax(subtotal, totalDiscount);
    const total = Number((finalSubtotal + shippingCost + tax).toFixed(2));

    return {
        subtotal: Number(subtotal.toFixed(2)),
        discountAmount,
        loyaltyDiscount,
        loyaltyPointsRedeemed,
        shippingCost,
        tax,
        total,
        coupon: coupon ? {
            _id: coupon._id,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue
        } : null
    };
};
