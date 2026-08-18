import express from 'express';
import { logEvent } from '../controllers/analyticsEventController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/events', optionalAuth, logEvent);

export default router;
