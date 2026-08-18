import express from 'express';
import {
    getReviews,
    createReview,
    updateReview,
    deleteReview,
    reportReview,
    voteReview
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.route('/')
    .get(getReviews)
    .post(protect, createReview);

// General review routes
// Base route: /api/v1/reviews
const generalReviewRouter = express.Router();

generalReviewRouter.route('/:reviewId')
    .patch(protect, updateReview)
    .delete(protect, deleteReview);

generalReviewRouter.route('/:reviewId/report')
    .post(protect, reportReview);

generalReviewRouter.route('/:reviewId/helpful')
    .post(protect, voteReview);

export { generalReviewRouter };
export default router;
