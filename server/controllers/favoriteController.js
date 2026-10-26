const Favorite = require('../models/Favorite');
const Material = require('../models/Material');

// @desc    Get all favorite materials of logged in user
// @route   GET /api/favorites
// @access  Private
const getFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'materialId',
        populate: {
          path: 'sellerId',
          select: 'name city state',
        },
      });

    // Filter out any favorites where the material might have been deleted
    const validFavorites = favorites.filter((fav) => fav.materialId !== null);

    res.json({
      success: true,
      count: validFavorites.length,
      favorites: validFavorites,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add material to favorites
// @route   POST /api/favorites/:materialId
// @access  Private
const addFavorite = async (req, res, next) => {
  try {
    const { materialId } = req.params;

    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found.',
      });
    }

    // Check if already favorited
    const existing = await Favorite.findOne({
      userId: req.user._id,
      materialId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Material is already in your favorites.',
      });
    }

    const favorite = await Favorite.create({
      userId: req.user._id,
      materialId,
    });

    res.status(201).json({
      success: true,
      message: 'Added to favorites!',
      favorite,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove material from favorites
// @route   DELETE /api/favorites/:materialId
// @access  Private
const removeFavorite = async (req, res, next) => {
  try {
    const { materialId } = req.params;

    const deleted = await Favorite.findOneAndDelete({
      userId: req.user._id,
      materialId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Favorite entry not found.',
      });
    }

    res.json({
      success: true,
      message: 'Removed from favorites.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if a material is favorited by logged in user
// @route   GET /api/favorites/check/:materialId
// @access  Private
const checkFavorite = async (req, res, next) => {
  try {
    const { materialId } = req.params;

    const favorite = await Favorite.findOne({
      userId: req.user._id,
      materialId,
    });

    res.json({
      success: true,
      isFavorite: Boolean(favorite),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
};
