import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { 
    getAdminReturns, 
    getAdminReturnDetails, 
    updateReturnStatus 
} from '../controllers/adminReturnController.js';

const router = express.Router();

router.use(protect, admin);

router.get('/', getAdminReturns);
router.get('/:id', getAdminReturnDetails);
router.patch('/:id/status', updateReturnStatus);

export default router;
