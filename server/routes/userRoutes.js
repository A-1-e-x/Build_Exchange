const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { validateUploadedImages } = upload;

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, upload.single('profileImage'), validateUploadedImages, updateUserProfile);

module.exports = router;
