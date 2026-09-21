import express from 'express';
const router = express.Router();
import {
  addOrderItems,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderToDelivered,
  updateOrderToPaid, //
  getOrderStats,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';



// User & Admin Routes
router
  .route('/')
  .post(protect, addOrderItems)
  .get(protect, admin, getOrders);

router.route('/myorders').get(protect, getMyOrders);

// Must be registered before '/:id' so Express doesn't treat "stats" as an id
router.route('/stats').get(protect, admin, getOrderStats);

router.route('/:id').get(protect, getOrderById);

router.route('/:id/pay').put(protect, updateOrderToPaid); 

router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);

export default router;