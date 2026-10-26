const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getOrderMessages,
  markMessageRead,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, sendMessage);
router.get('/order/:orderId', protect, getOrderMessages);
router.patch('/:id/read', protect, markMessageRead);

module.exports = router;
