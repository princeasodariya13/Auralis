import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { 
    getCoupons, 
    getCoupon, 
    createCoupon, 
    updateCoupon, 
    deleteCoupon 
} from '../controllers/adminCouponController.js';
import { calculateCheckoutTotals } from '../services/discountService.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const couponLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: { success: false, error: { message: 'Too many coupon validation attempts from this IP, please try again after 15 minutes' }}
});

// CUSTOMER COUPON VALIDATION endpoint
// POST /api/v1/coupons/validate
router.post('/validate', protect, couponLimiter, async (req, res) => {
    try {
        const { couponCode } = req.body;
        
        if (!couponCode) {
            return res.status(400).json({ success: false, error: { message: 'Coupon code is required' }});
        }

        // Must derive everything securely from the server
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, error: { message: 'Cart is empty' }});
        }

        const productIds = cart.items.map(i => i.productId);
        const products = await Product.find({ id: { $in: productIds } });
        
        let subtotal = 0;
        for (const cartItem of cart.items) {
            const product = products.find(p => p.id === cartItem.productId);
            if (product && product.isActive) {
                subtotal += (product.price * cartItem.quantity);
            }
        }

        // This service will throw an Error if the coupon is invalid
        const totals = await calculateCheckoutTotals(subtotal, couponCode, req.user._id);

        res.json({
            success: true,
            data: totals
        });

    } catch (error) {
        // Return clear user-friendly error messages if validation fails
        if (error.message.includes('Invalid coupon') || error.message.includes('Coupon') || error.message.includes('limit') || error.message.includes('order value')) {
            return res.status(400).json({ success: false, error: { message: error.message }});
        }
        console.error('Coupon Validate Error:', error);
        res.status(500).json({ success: false, error: { message: 'Failed to validate coupon' }});
    }
});

// ADMIN ROUTES
router.route('/admin')
    .get(protect, admin, getCoupons)
    .post(protect, admin, createCoupon);

router.route('/admin/:id')
    .get(protect, admin, getCoupon)
    .patch(protect, admin, updateCoupon)
    .delete(protect, admin, deleteCoupon);

export default router;
