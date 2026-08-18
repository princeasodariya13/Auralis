import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    getShipmentExceptions,
    getExceptionsSummary,
    acknowledgeException,
    resolveException
} from '../controllers/adminShipmentExceptionController.js';

const router = express.Router();

router.use(protect, admin);

router.route('/')
    .get(getShipmentExceptions);

router.route('/summary')
    .get(getExceptionsSummary);

router.route('/:id/acknowledge')
    .patch(acknowledgeException);

router.route('/:id/resolve')
    .patch(resolveException);

export default router;
