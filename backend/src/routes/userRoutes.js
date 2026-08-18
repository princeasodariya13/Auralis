import express from 'express';
import { updateProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.patch('/me', protect, updateProfile);

export default router;
