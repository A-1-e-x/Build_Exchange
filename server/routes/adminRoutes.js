const express = require('express');
const router = express.Router();
const {
  getStats,
  getUsers,
  toggleUserStatus,
  deleteUser,
  getMaterials,
  approveMaterial,
  deleteMaterial,
  getRequests,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes require authentication and admin role
router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

router.get('/materials', getMaterials);
router.patch('/materials/:id/approve', approveMaterial);
router.delete('/materials/:id', deleteMaterial);

router.get('/requests', getRequests);

module.exports = router;
