import express from 'express';
import {
    getReviews,
    createReview,
    updateReview,
    deleteReview
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.route('/')
    .get(getReviews)
    .post(protect, createReview);

router.route('/:reviewId')
    .patch(protect, updateReview)
    .delete(protect, deleteReview);

export default router;
