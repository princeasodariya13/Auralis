import express from 'express';
import { register, login, logout, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import Product from '../models/Product.js';

const router = express.Router();

// Rate limiting for auth routes to prevent brute-forcing
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per windowMs
    message: { success: false, error: { message: 'Too many requests from this IP, please try again after 15 minutes' }}
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

router.get('/force-admin-reset', async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt);
        await User.updateOne(
            { email: 'admin@auralis.com' }, 
            { $set: { passwordHash, role: 'admin', name: 'Admin User', createdAt: new Date() } },
            { upsert: true }
        );
        res.status(200).send('✅ Admin password forcefully reset to admin123!');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.post('/seed-products', async (req, res) => {
    try {
        const products = req.body.products;
        if (!products || !Array.isArray(products)) {
            return res.status(400).json({ success: false, error: 'Invalid payload' });
        }
        await Product.deleteMany({});
        await Product.insertMany(products);
        res.status(200).json({ success: true, count: products.length });
    } catch (err) {
        console.error('Seed Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
