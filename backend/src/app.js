import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import reviewRoutes, { generalReviewRouter } from './routes/reviewRoutes.js';
import adminReviewRoutes from './routes/adminReviewRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import customerNotificationRoutes from './routes/customerNotificationRoutes.js';
import returnRoutes from './routes/returnRoutes.js';
import adminShipmentRoutes from './routes/adminShipmentRoutes.js';
import adminShipmentExceptionRoutes from './routes/adminShipmentExceptionRoutes.js';
import adminCustomerRoutes from './routes/adminCustomerRoutes.js';
import supportTicketRoutes from './routes/supportTicketRoutes.js';
import adminSupportRoutes from './routes/adminSupportRoutes.js';
import shipmentRoutes from './routes/shipmentRoutes.js';
import adminAuditRoutes from './routes/adminAuditRoutes.js';
import analyticsEventRoutes from './routes/analyticsEventRoutes.js';
import financialReconciliationRoutes from './routes/financialReconciliationRoutes.js';
import loyaltyRoutes from './routes/loyaltyRoutes.js';
import adminReturnRoutes from './routes/adminReturnRoutes.js';

import { handleWebhook } from './controllers/paymentController.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { correlationIdMiddleware } from './middleware/correlationId.js';
import mongoose from 'mongoose';

const app = express();

// Webhook must be parsed as raw body for signature verification
app.post('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false
}));
app.use(correlationIdMiddleware);
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
app.use('/api/v1/admin/orders', adminShipmentRoutes);
app.use('/api/v1/admin/shipment-exceptions', adminShipmentExceptionRoutes);
app.use('/api/v1/admin/customers', adminCustomerRoutes);
app.use('/api/v1/admin/returns', adminReturnRoutes);
app.use('/api/v1/admin/support', adminSupportRoutes);
app.use('/api/v1/admin/reviews', adminReviewRoutes);
app.use('/api/v1/admin', adminShipmentRoutes);
app.use('/api/v1/admin/audit-logs', adminAuditRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/notifications', customerNotificationRoutes);
app.use('/api/v1/admin/reconciliation', financialReconciliationRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);
app.use('/api/v1/returns', returnRoutes);
app.use('/api/v1/support', supportTicketRoutes);
app.use('/api/v1/loyalty', loyaltyRoutes);
app.use('/api/v1/analytics', analyticsEventRoutes);
app.use('/api/v1/products/:productId/reviews', reviewRoutes);
app.use('/api/v1/reviews', generalReviewRouter);
app.use('/api/v1', shipmentRoutes);
app.use('/api/v1', productRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'ok',
        message: 'Auralis API is running'
    });
});

// Readiness Check Endpoint
app.get('/api/ready', (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
        res.status(200).json({
            success: true,
            status: 'ok',
            database: 'connected'
        });
    } else {
        res.status(503).json({
            success: false,
            status: 'unavailable',
            database: 'disconnected'
        });
    }
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
