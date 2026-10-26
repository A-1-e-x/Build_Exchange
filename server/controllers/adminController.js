const User = require('../models/User');
const Material = require('../models/Material');
const Request = require('../models/Request');
const Category = require('../models/Category');
const ImageAnalysis = require('../models/ImageAnalysis');

// @desc    Get comprehensive admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalBuyers,
      totalSellers,
      totalAdmins,
      totalMaterials,
      activeMaterials,
      soldMaterials,
      pendingApprovals,
      totalRequests,
      pendingRequests,
      acceptedRequests,
      completedRequests,
      categoryStats,
      conditionStats,
      recentUsers,
      recentMaterials,
      recentRequests,
      aiTotal,
      aiLikelyDuplicates,
      aiPossibleDuplicates,
      aiPendingReview,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'buyer' }),
      User.countDocuments({ role: 'seller' }),
      User.countDocuments({ role: 'admin' }),
      Material.countDocuments(),
      Material.countDocuments({ status: 'available', isApproved: true }),
      Material.countDocuments({ status: 'sold' }),
      Material.countDocuments({ isApproved: false }),
      Request.countDocuments(),
      Request.countDocuments({ status: 'pending' }),
      Request.countDocuments({ status: 'accepted' }),
      Request.countDocuments({ status: 'completed' }),
      Material.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Material.aggregate([
        { $group: { _id: '$condition', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      User.find().sort({ createdAt: -1 }).limit(5).select('-password'),
      Material.find().sort({ createdAt: -1 }).limit(5).populate('sellerId', 'name email'),
      Request.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('buyerId', 'name')
        .populate('sellerId', 'name')
        .populate('materialId', 'name price unit'),
      ImageAnalysis.countDocuments(),
      ImageAnalysis.countDocuments({ result: 'likely_duplicate' }),
      ImageAnalysis.countDocuments({ result: 'possible_duplicate' }),
      ImageAnalysis.countDocuments({
        result: { $in: ['likely_duplicate', 'possible_duplicate'] },
        reviewStatus: 'not_reviewed',
      }),
    ]);

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          buyers: totalBuyers,
          sellers: totalSellers,
          admins: totalAdmins,
        },
        materials: {
          total: totalMaterials,
          active: activeMaterials,
          sold: soldMaterials,
          pendingApproval: pendingApprovals,
        },
        requests: {
          total: totalRequests,
          pending: pendingRequests,
          accepted: acceptedRequests,
          completed: completedRequests,
        },
        categoryBreakdown: categoryStats.map((item) => ({
          category: item._id || 'Uncategorized',
          count: item.count,
        })),
        conditionBreakdown: conditionStats.map((item) => ({
          condition: item._id || 'Standard',
          count: item.count,
        })),
        recentActivity: {
          users: recentUsers,
          materials: recentMaterials,
          requests: recentRequests,
        },
        ai: {
          total: aiTotal,
          likelyDuplicates: aiLikelyDuplicates,
          possibleDuplicates: aiPossibleDuplicates,
          pendingReview: aiPendingReview,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (with search, filter, pagination)
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;

    const query = {};

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { city: searchRegex },
        { state: searchRegex },
      ];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status !== undefined && status !== 'all') {
      query.isActive = status === 'active';
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-password');

    res.json({
      success: true,
      count: users.length,
      total: totalUsers,
      totalPages: Math.ceil(totalUsers / limitNum) || 1,
      currentPage: pageNum,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user status (Active / Disabled)
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Protect self-deactivation
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own admin account.',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User account is now ${user.isActive ? 'Active' : 'Disabled'}.`,
      isActive: user.isActive,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account.',
      });
    }

    // Delete user's materials if seller
    await Material.deleteMany({ sellerId: user._id });
    await user.deleteOne();

    res.json({
      success: true,
      message: 'User and their associated listings deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all materials for admin
// @route   GET /api/admin/materials
// @access  Private (Admin)
const getMaterials = async (req, res, next) => {
  try {
    const { search, category, status, approval, page = 1, limit = 10 } = req.query;

    const query = {};

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { category: searchRegex },
        { city: searchRegex },
        { district: searchRegex },
        { state: searchRegex },
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (approval && approval !== 'all') {
      query.isApproved = approval === 'approved';
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const totalMaterials = await Material.countDocuments(query);
    const materials = await Material.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('sellerId', 'name email phone');

    res.json({
      success: true,
      count: materials.length,
      total: totalMaterials,
      totalPages: Math.ceil(totalMaterials / limitNum) || 1,
      currentPage: pageNum,
      materials,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject a material listing
// @route   PATCH /api/admin/materials/:id/approve
// @access  Private (Admin)
const approveMaterial = async (req, res, next) => {
  try {
    const { isApproved } = req.body;
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material listing not found.',
      });
    }

    material.isApproved = isApproved !== undefined ? Boolean(isApproved) : !material.isApproved;
    await material.save();

    res.json({
      success: true,
      message: `Material listing has been ${material.isApproved ? 'Approved' : 'Unapproved/Rejected'}.`,
      material,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete any material listing as admin
// @route   DELETE /api/admin/materials/:id
// @access  Private (Admin)
const deleteMaterial = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material listing not found.',
      });
    }

    await material.deleteOne();

    res.json({
      success: true,
      message: 'Material listing deleted by administrator successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all requests for admin
// @route   GET /api/admin/requests
// @access  Private (Admin)
const getRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 15 } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const totalRequests = await Request.countDocuments(query);
    const requests = await Request.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('materialId', 'name category price unit images')
      .populate('buyerId', 'name email phone city state')
      .populate('sellerId', 'name email phone city state');

    res.json({
      success: true,
      count: requests.length,
      total: totalRequests,
      totalPages: Math.ceil(totalRequests / limitNum) || 1,
      currentPage: pageNum,
      requests,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getUsers,
  toggleUserStatus,
  deleteUser,
  getMaterials,
  approveMaterial,
  deleteMaterial,
  getRequests,
};
