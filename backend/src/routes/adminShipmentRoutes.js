import express from 'express';
import { getAdminShipments, createAdminShipment, updateAdminShipment } from '../controllers/adminShipmentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, admin);

router.route('/orders/:orderNumber/shipments')
    .get(getAdminShipments)
    .post(createAdminShipment);

router.route('/shipments/:shipmentId')
    .patch(updateAdminShipment);

export default router;
