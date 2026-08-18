import express from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart, mergeCart } from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All cart routes require authentication
router.use(protect);

router.get('/', getCart);
router.delete('/', clearCart);
router.post('/items', addToCart);
router.patch('/items/:productId', updateCartItem);
router.delete('/items/:productId', removeFromCart);
router.post('/merge', mergeCart);

export default router;
