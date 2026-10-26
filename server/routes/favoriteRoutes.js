const express = require('express');
const router = express.Router();
const {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
} = require('../controllers/favoriteController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All favorite routes are private to authenticated users

router.get('/', getFavorites);
router.post('/:materialId', addFavorite);
router.delete('/:materialId', removeFavorite);
router.get('/check/:materialId', checkFavorite);

module.exports = router;
