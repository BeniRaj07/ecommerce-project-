import express from 'express';
const router = express.Router();
import {
  addOrderItems,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderToDelivered,
  updateOrderToPaid, //
  updateOrderStatus,
  requestCancellation,
  approveCancellation,
  rejectCancellation,
  requestReturn,
  approveReturn,
  rejectReturn,
  markReturned,
  initiateEsewaPayment,
  verifyEsewaPayment,
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

router.route('/:id/esewa/initiate').post(protect, initiateEsewaPayment);

router.route('/:id/esewa/verify').post(protect, verifyEsewaPayment);

router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);

router.route('/:id/status').put(protect, admin, updateOrderStatus);

router.route('/:id/cancel-request').put(protect, requestCancellation);
router.route('/:id/cancel/approve').put(protect, admin, approveCancellation);
router.route('/:id/cancel/reject').put(protect, admin, rejectCancellation);

router.route('/:id/return-request').put(protect, requestReturn);
router.route('/:id/return/approve').put(protect, admin, approveReturn);
router.route('/:id/return/reject').put(protect, admin, rejectReturn);
router.route('/:id/return/complete').put(protect, admin, markReturned);

export default router;