import express from 'express';
import { getAuditLogs, getAuditFilters } from '../controllers/adminAuditController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, admin);

router.get('/', getAuditLogs);
router.get('/filters', getAuditFilters);

export default router;
