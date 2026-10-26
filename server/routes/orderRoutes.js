const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getOrderById,
  updatePickupDetails,
  markOrderReady,
  completeOrder,
  cancelOrder,
  getTransactions,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/seller', protect, authorize('seller', 'admin'), getSellerOrders);
router.get('/transactions', protect, getTransactions);
router.get('/:id', protect, getOrderById);

router.patch('/:id/pickup', protect, authorize('seller', 'admin'), updatePickupDetails);
router.patch('/:id/ready', protect, authorize('seller', 'admin'), markOrderReady);
router.patch('/:id/complete', protect, authorize('seller', 'admin'), completeOrder);
router.patch('/:id/cancel', protect, cancelOrder);

module.exports = router;
