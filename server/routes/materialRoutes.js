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
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/featured', getFeaturedMaterials);
router.get('/my', protect, authorize('seller', 'admin'), getMyMaterials);

router
  .route('/')
  .get(getMaterials)
  .post(
    protect,
    authorize('seller', 'admin'),
    upload.array('images', 6),
    createMaterial
  );

router
  .route('/:id')
  .get(getMaterialById)
  .put(
    protect,
    authorize('seller', 'admin'),
    upload.array('images', 6),
    updateMaterial
  )
  .delete(protect, authorize('seller', 'admin'), deleteMaterial);

router.patch('/:id/status', protect, authorize('seller', 'admin'), toggleMaterialStatus);

module.exports = router;
