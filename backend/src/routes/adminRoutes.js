import express from 'express';
import { getDashboard } from '../controllers/adminController.js';
import { getAdminProducts, getAdminProductById, createProduct, updateProduct, deleteProduct } from '../controllers/adminProductController.js';
import { getInventory, getInventorySummary, adjustInventory, getInventoryHistory } from '../controllers/adminInventoryController.js';
import { getAdminOrders, getAdminOrderDetails, updateOrderStatus, getOrderHistory, getOrderNotes, addOrderNote } from '../controllers/adminOrderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes here are prefixed with /api/v1/admin
router.get('/dashboard', protect, admin, getDashboard);

router.get('/products', protect, admin, getAdminProducts);
router.get('/products/:id', protect, admin, getAdminProductById);
router.post('/products', protect, admin, createProduct);
router.patch('/products/:id', protect, admin, updateProduct);
router.delete('/products/:id', protect, admin, deleteProduct);

router.get('/inventory', protect, admin, getInventory);
router.get('/inventory/summary', protect, admin, getInventorySummary);
router.post('/inventory/:productId/adjust', protect, admin, adjustInventory);
router.get('/inventory/:productId/history', protect, admin, getInventoryHistory);

router.get('/orders', protect, admin, getAdminOrders);
router.get('/orders/:orderNumber', protect, admin, getAdminOrderDetails);
router.patch('/orders/:orderNumber/status', protect, admin, updateOrderStatus);
router.get('/orders/:orderNumber/history', protect, admin, getOrderHistory);
router.get('/orders/:orderNumber/notes', protect, admin, getOrderNotes);
router.post('/orders/:orderNumber/notes', protect, admin, addOrderNote);

export default router;
