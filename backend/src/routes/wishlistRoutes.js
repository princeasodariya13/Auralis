import express from 'express';
import {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getWishlist)
    .delete(clearWishlist);

router.route('/:productId')
    .post(addToWishlist)
    .delete(removeFromWishlist);

export default router;
