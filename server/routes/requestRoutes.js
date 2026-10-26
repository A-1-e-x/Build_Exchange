const express = require('express');
const router = express.Router();
const {
  createRequest,
  getMyRequests,
  getReceivedRequests,
  acceptRequest,
  rejectRequest,
  updateRequestStatus,
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, createRequest);
router.get('/my', protect, getMyRequests);
router.get('/received', protect, authorize('seller', 'admin'), getReceivedRequests);

router.patch('/:id/accept', protect, authorize('seller', 'admin'), acceptRequest);
router.patch('/:id/reject', protect, authorize('seller', 'admin'), rejectRequest);
router.patch('/:id/status', protect, authorize('seller', 'admin'), updateRequestStatus);

module.exports = router;
