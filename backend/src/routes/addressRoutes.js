import express from 'express';
import { 
    getAddresses, 
    createAddress, 
    updateAddress, 
    deleteAddress, 
    setDefaultAddress 
} from '../controllers/addressController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All address routes require authentication

router.route('/')
    .get(getAddresses)
    .post(createAddress);

router.route('/:id')
    .patch(updateAddress)
    .delete(deleteAddress);

router.route('/:id/default')
    .patch(setDefaultAddress);

export default router;
