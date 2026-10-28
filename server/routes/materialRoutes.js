const express = require('express');
const router = express.Router();
const {
  getMaterials,
  getFeaturedMaterials,
  getMyMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  toggleMaterialStatus,
} = require('../controllers/materialController');
const { protect, authorize, optionalAuth } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { validateUploadedImages } = upload;

router.get('/featured', getFeaturedMaterials);
router.get('/my', protect, authorize('seller', 'admin'), getMyMaterials);

router
  .route('/')
  .get(getMaterials)
  .post(
    protect,
    authorize('seller', 'admin'),
    upload.array('images', 6),
    validateUploadedImages,
    createMaterial
  );

router
  .route('/:id')
  .get(optionalAuth, getMaterialById)
  .put(
    protect,
    authorize('seller', 'admin'),
    upload.array('images', 6),
    validateUploadedImages,
    updateMaterial
  )
  .delete(protect, authorize('seller', 'admin'), deleteMaterial);

router.patch('/:id/status', protect, authorize('seller', 'admin'), toggleMaterialStatus);

module.exports = router;
