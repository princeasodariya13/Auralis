import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createPaymentOrder, verifyPayment, handleWebhook } from '../controllers/paymentController.js';

const router = express.Router();

// Webhook needs raw body parsing, so it's placed here or handled specifically in main app.js
// Since app.js might already use express.json() globally, we have to bypass it.
// The easiest way is to apply raw parsing specifically for this route in app.js, or just parse here.
// Assuming app.js has app.use(express.json()), we'll export handleWebhook to be used BEFORE express.json() in app.js.

router.post('/create-order', protect, createPaymentOrder);
router.post('/verify', protect, verifyPayment);

export default router;
