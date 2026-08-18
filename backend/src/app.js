import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import customerNotificationRoutes from './routes/customerNotificationRoutes.js';
import returnRoutes from './routes/returnRoutes.js';
import adminReturnRoutes from './routes/adminReturnRoutes.js';

import { handleWebhook } from './controllers/paymentController.js';
import { errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Webhook must be parsed as raw body for signature verification
app.post('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Middleware
app.use(express.json({ limit: '10kb' })); // Body limit is 10kb
app.use(cookieParser());
app.use(cors({
    origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true // Crucial for accepting HTTP-only cookies from the frontend
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per `window` (here, per 15 minutes)
    message: { success: false, error: { message: 'Too many requests from this IP, please try again after 15 minutes' } }
});
app.use('/api', limiter);

import addressRoutes from './routes/addressRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import couponRoutes from './routes/couponRoutes.js';

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin/returns', adminReturnRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/notifications', customerNotificationRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);
app.use('/api/v1/returns', returnRoutes);
app.use('/api/v1/products/:productId/reviews', reviewRoutes);
app.use('/api/v1', productRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'ok',
        message: 'Auralis API is running'
    });
});

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: { message: `Route not found - ${req.originalUrl}` }
    });
});

// Global Error Handler
app.use(errorHandler);

export default app;
