import express from 'express';
import { getShipmentsByOrder } from '../controllers/shipmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/orders/:orderNumber/shipments')
    .get(getShipmentsByOrder);

export default router;
