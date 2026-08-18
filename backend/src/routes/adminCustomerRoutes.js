import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getCustomers, getCustomerDetails } from '../controllers/adminCustomerController.js';
import { getCustomerLoyalty, adjustCustomerLoyalty } from '../controllers/adminLoyaltyController.js';

const router = express.Router();

router.use(protect, admin);

router.route('/')
    .get(getCustomers);

router.route('/:id')
    .get(getCustomerDetails);

router.route('/:id/loyalty')
    .get(getCustomerLoyalty);

router.route('/:id/loyalty-adjustment')
    .post(adjustCustomerLoyalty);

export default router;
