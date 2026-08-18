import express from 'express';
import { 
    previewCheckout,
    createOrder,
    getMyOrders,
    getOrderByNumber,
    cancelOrder
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/preview', previewCheckout);

router.route('/')
    .get(getMyOrders)
    .post(createOrder);

router.route('/:orderNumber')
    .get(getOrderByNumber);

router.route('/:orderNumber/cancel')
    .post(cancelOrder);

export default router;
