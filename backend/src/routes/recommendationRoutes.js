import express from 'express';
import { getRelatedProducts, getFrequentlyBoughtTogether } from '../controllers/recommendationController.js';

const router = express.Router();

router.get('/related/:id', getRelatedProducts);
router.get('/frequently-bought/:id', getFrequentlyBoughtTogether);

export default router;
