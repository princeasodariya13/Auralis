import express from 'express';
import { 
    getAdminReviews,
    updateReviewModeration,
    getReviewReports
} from '../controllers/adminReviewController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, admin);

router.route('/')
    .get(getAdminReviews);

router.route('/:reviewId/moderation')
    .patch(updateReviewModeration);

router.route('/:reviewId/reports')
    .get(getReviewReports);

export default router;
