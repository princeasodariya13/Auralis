import express from 'express';
import { getShipmentsByOrder } from '../controllers/shipmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/orders/:orderNumber/shipments')
    .get(protect, getShipmentsByOrder);

export default router;
