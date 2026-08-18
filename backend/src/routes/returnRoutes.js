import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
    getReturnEligibility, 
    createReturnRequest, 
    getMyReturns, 
    getReturnDetails, 
    cancelReturnRequest 
} from '../controllers/returnController.js';

const router = express.Router();

router.use(protect);

router.get('/eligibility/:orderNumber', getReturnEligibility);
router.post('/', createReturnRequest);
router.get('/', getMyReturns);
router.get('/:id', getReturnDetails);
router.patch('/:id/cancel', cancelReturnRequest);

export default router;
