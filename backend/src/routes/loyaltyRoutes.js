import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getMyLoyalty } from '../controllers/loyaltyController.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getMyLoyalty);

export default router;
