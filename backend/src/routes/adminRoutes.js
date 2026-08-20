import express from 'express';
import { getDashboard } from '../controllers/adminController.js';
import { getAdminProducts, getAdminProductById, createProduct, updateProduct, deleteProduct } from '../controllers/adminProductController.js';
import { getInventory, getInventorySummary, adjustInventory, getInventoryHistory } from '../controllers/adminInventoryController.js';
import { getAdminOrders, getAdminOrderDetails, updateOrderStatus, getOrderHistory, getOrderNotes, addOrderNote } from '../controllers/adminOrderController.js';
import { getAnalytics } from '../controllers/adminAnalyticsController.js';
import { getSystemHealth } from '../controllers/adminHealthController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All routes here are prefixed with /api/v1/admin
router.use(protect, admin);

router.get('/dashboard', getDashboard);
router.get('/health', getSystemHealth);
router.get('/analytics', getAnalytics);

router.get('/products', getAdminProducts);
router.get('/products/:id', getAdminProductById);
router.post('/products', upload.array('imageFiles', 5), createProduct);
router.patch('/products/:id', upload.array('imageFiles', 5), updateProduct);
router.delete('/products/:id', deleteProduct);

router.get('/inventory', getInventory);
router.get('/inventory/summary', getInventorySummary);
router.post('/inventory/:productId/adjust', adjustInventory);
router.get('/inventory/:productId/history', getInventoryHistory);

router.get('/orders', getAdminOrders);
router.get('/orders/:orderNumber', getAdminOrderDetails);
router.patch('/orders/:orderNumber/status', updateOrderStatus);
router.get('/orders/:orderNumber/history', getOrderHistory);
router.get('/orders/:orderNumber/notes', getOrderNotes);
router.post('/orders/:orderNumber/notes', addOrderNote);

export default router;
