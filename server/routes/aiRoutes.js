const express = require('express');
const router = express.Router();
const {
  analyzeImageHandler,
  verifyImageHandler,
  getMaterialAnalysis,
  getFlaggedImages,
  reviewFlaggedImage,
  syncMaterialsHandler,
  getAiStats,
} = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public/seller analysis endpoints (accepts multipart/form-data 'image' or json 'imageUrl')
router.post('/analyze-image', protect, upload.single('image'), analyzeImageHandler);
router.post('/verify-image', protect, upload.single('image'), verifyImageHandler);

// Material-specific analysis & verification lookup
router.get('/material/:materialId', protect, getMaterialAnalysis);

// Admin-only monitoring, review, and verification stats
router.get('/flagged', protect, authorize('admin'), getFlaggedImages);
router.patch('/:analysisId/review', protect, authorize('admin'), reviewFlaggedImage);
router.post('/sync', protect, authorize('admin'), syncMaterialsHandler);
router.get('/stats', protect, authorize('admin'), getAiStats);

module.exports = router;
