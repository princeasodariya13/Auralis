import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

import { handleWebhook } from './controllers/paymentController.js';

const app = express();

// Webhook must be parsed as raw body for signature verification
app.post('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true // Crucial for accepting HTTP-only cookies from the frontend
}));

import addressRoutes from './routes/addressRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/payments', paymentRoutes);
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

export default app;
