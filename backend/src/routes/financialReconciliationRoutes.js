import express from 'express';
import { getSummary, listAnomalies } from '../controllers/financialReconciliationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, admin);

router.get('/summary', getSummary);
router.get('/anomalies', listAnomalies);

export default router;
