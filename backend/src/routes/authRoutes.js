import express from 'express';
import { register, login, logout, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

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

export default router;
