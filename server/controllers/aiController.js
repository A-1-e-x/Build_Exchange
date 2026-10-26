const ImageAnalysis = require('../models/ImageAnalysis');
const Material = require('../models/Material');
const { analyzeImage, syncAllMaterials } = require('../services/aiImageService');
const { verifyImageAuthenticity } = require('../services/aiImageVerificationService');

// @desc    Analyze an uploaded image or image URL for duplicate/near-duplicate detection (Legacy/Fast)
// @route   POST /api/ai/analyze-image
// @access  Private (Seller/Admin/Buyer)
const analyzeImageHandler = async (req, res, next) => {
  try {
    let imageSource = null;
    let imageUrl = '';
    let public_id = '';

    if (req.file) {
      imageSource = req.file.buffer;
      imageUrl = `/uploads/temp_${Date.now()}_${req.file.originalname}`;
    } else if (req.body.imageBase64) {
      const matches = req.body.imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      imageSource = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(req.body.imageBase64, 'base64');
      imageUrl = req.body.imageUrl || `/uploads/temp_${Date.now()}.jpg`;
      public_id = req.body.public_id || '';
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
      imageSource = req.body.imageUrl;
      public_id = req.body.public_id || '';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide an image file (multipart/form-data), imageBase64, or imageUrl in request body.',
      });
    }

    const materialId = req.body.materialId || null;
    const sellerId = req.user ? req.user._id : null;
    const saveRecord = req.body.saveRecord === 'true' || req.body.saveRecord === true;

    // Run multi-signal verification engine
    const result = await verifyImageAuthenticity({
      imageSource,
      imageUrl,
      public_id,
      materialId,
      sellerId,
      saveRecord,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Full Multi-Signal AI Image Authenticity Verification
// @route   POST /api/ai/verify-image
// @access  Private (Seller/Admin/Buyer)
const verifyImageHandler = async (req, res, next) => {
  try {
    let imageSource = null;
    let imageUrl = '';
    let public_id = '';

    if (req.file) {
      imageSource = req.file.buffer;
      imageUrl = `/uploads/temp_${Date.now()}_${req.file.originalname}`;
    } else if (req.body.imageBase64) {
      const matches = req.body.imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      imageSource = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(req.body.imageBase64, 'base64');
      imageUrl = req.body.imageUrl || `/uploads/temp_${Date.now()}.jpg`;
      public_id = req.body.public_id || '';
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
      imageSource = req.body.imageUrl;
      public_id = req.body.public_id || '';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide an image file (multipart/form-data), imageBase64, or imageUrl in request body.',
      });
    }

    const materialId = req.body.materialId || null;
    const sellerId = req.user ? req.user._id : null;
    const saveRecord = req.body.saveRecord === 'true' || req.body.saveRecord === true;

    const result = await verifyImageAuthenticity({
      imageSource,
      imageUrl,
      public_id,
      materialId,
      sellerId,
      saveRecord,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get image analysis/verification results for a specific material
// @route   GET /api/ai/material/:materialId
// @access  Private
const getMaterialAnalysis = async (req, res, next) => {
  try {
    const { materialId } = req.params;

    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found.',
      });
    }

    const analyses = await ImageAnalysis.find({ materialId })
      .populate('reviewedBy', 'name email role')
      .populate({
        path: 'closestMatch.materialId',
        select: 'name category price sellerId status images',
        populate: { path: 'sellerId', select: 'name email phone' },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: analyses.length,
      analyses,
      verificationSummary: material.verificationSummary || null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all flagged or suspicious images for admin monitoring
// @route   GET /api/ai/flagged
// @access  Private (Admin only)
const getFlaggedImages = async (req, res, next) => {
  try {
    const {
      verificationStatus, // 'POSSIBLY_AI_GENERATED' | 'DUPLICATE_DETECTED' | 'POSSIBLY_DOWNLOADED' | 'MANUAL_REVIEW_REQUIRED' | 'all'
      result, // 'likely_duplicate' | 'possible_duplicate' | 'suspicious' | 'all'
      reviewStatus, // 'not_reviewed' | 'reviewed' | 'confirmed' | 'dismissed' | 'all'
      minRisk = 0,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Filter by new multi-signal verificationStatus
    if (verificationStatus && verificationStatus !== 'all') {
      query.verificationStatus = verificationStatus;
    } else if (result && result !== 'all') {
      // Legacy filter support
      query.result = result;
    } else {
      // By default show all suspicious, duplicate, downloaded, or manual review items
      query.$or = [
        {
          verificationStatus: {
            $in: [
              'POSSIBLY_AI_GENERATED',
              'DUPLICATE_DETECTED',
              'POSSIBLY_DOWNLOADED',
              'MANUAL_REVIEW_REQUIRED',
            ],
          },
        },
        { result: { $in: ['likely_duplicate', 'possible_duplicate', 'suspicious'] } },
      ];
    }

    // Filter by admin review status
    if (reviewStatus && reviewStatus !== 'all') {
      query.reviewStatus = reviewStatus;
    }

    // Filter by minimum risk score if specified
    if (Number(minRisk) > 0) {
      query.riskScore = { $gte: Number(minRisk) };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await ImageAnalysis.countDocuments(query);
    const flaggedItems = await ImageAnalysis.find(query)
      .populate('sellerId', 'name email phone city state profileImage')
      .populate('materialId', 'name category price status isApproved')
      .populate('reviewedBy', 'name email')
      .populate({
        path: 'closestMatch.materialId',
        select: 'name category price sellerId status images',
        populate: { path: 'sellerId', select: 'name email phone' },
      })
      .sort({ riskScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      count: flaggedItems.length,
      flagged: flaggedItems,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review and update flag status for an analyzed image
// @route   PATCH /api/ai/:analysisId/review
// @access  Private (Admin only)
const reviewFlaggedImage = async (req, res, next) => {
  try {
    const { analysisId } = req.params;
    const { reviewStatus, reviewNotes, overrideStatus } = req.body;

    const validStatuses = ['not_reviewed', 'reviewed', 'confirmed', 'dismissed'];
    if (!reviewStatus || !validStatuses.includes(reviewStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid review status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const analysis = await ImageAnalysis.findById(analysisId);
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Image analysis record not found.',
      });
    }

    analysis.reviewStatus = reviewStatus;
    analysis.reviewedBy = req.user._id;
    analysis.reviewedAt = new Date();

    if (reviewNotes !== undefined) {
      analysis.reviewNotes = reviewNotes;
    }

    if (overrideStatus) {
      analysis.verificationStatus = overrideStatus;
    }

    await analysis.save();

    // If review status changes to confirmed or dismissed, sync with material if available
    if (analysis.materialId) {
      try {
        await Material.findByIdAndUpdate(analysis.materialId, {
          'verificationSummary.status': reviewStatus === 'dismissed' ? 'LIKELY_ORIGINAL' : analysis.verificationStatus,
        });
      } catch (matErr) {}
    }

    res.json({
      success: true,
      message: `Image analysis review status updated to '${reviewStatus}'.`,
      analysis,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Batch sync/index existing materials that lack analysis records
// @route   POST /api/ai/sync
// @access  Private (Admin only)
const syncMaterialsHandler = async (req, res, next) => {
  try {
    const syncResult = await syncAllMaterials();
    res.json({
      success: true,
      message: `Sync completed: ${syncResult.indexedCount} new images verified, ${syncResult.skippedCount} previously indexed.`,
      ...syncResult,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get aggregated AI analysis and authenticity statistics for Admin dashboard
// @route   GET /api/ai/stats
// @access  Private (Admin only)
const getAiStats = async (req, res, next) => {
  try {
    const totalAnalyses = await ImageAnalysis.countDocuments();
    const likelyDuplicates = await ImageAnalysis.countDocuments({
      $or: [{ result: 'likely_duplicate' }, { verificationStatus: 'DUPLICATE_DETECTED' }],
    });
    const possibleDuplicates = await ImageAnalysis.countDocuments({ result: 'possible_duplicate' });

    // Multi-signal counts
    const aiGeneratedCount = await ImageAnalysis.countDocuments({ verificationStatus: 'POSSIBLY_AI_GENERATED' });
    const downloadedCount = await ImageAnalysis.countDocuments({ verificationStatus: 'POSSIBLY_DOWNLOADED' });
    const duplicateCount = await ImageAnalysis.countDocuments({ verificationStatus: 'DUPLICATE_DETECTED' });
    const manualReviewCount = await ImageAnalysis.countDocuments({ verificationStatus: 'MANUAL_REVIEW_REQUIRED' });
    const likelyOriginalCount = await ImageAnalysis.countDocuments({ verificationStatus: 'LIKELY_ORIGINAL' });

    const pendingReview = await ImageAnalysis.countDocuments({
      $or: [
        { verificationStatus: { $in: ['POSSIBLY_AI_GENERATED', 'DUPLICATE_DETECTED', 'POSSIBLY_DOWNLOADED', 'MANUAL_REVIEW_REQUIRED'] } },
        { result: { $in: ['likely_duplicate', 'possible_duplicate', 'suspicious'] } },
      ],
      reviewStatus: 'not_reviewed',
    });

    const confirmedDuplicates = await ImageAnalysis.countDocuments({ reviewStatus: 'confirmed' });
    const dismissedFlags = await ImageAnalysis.countDocuments({ reviewStatus: 'dismissed' });

    res.json({
      success: true,
      stats: {
        totalAnalyses,
        aiGeneratedCount,
        downloadedCount,
        duplicateCount,
        manualReviewCount,
        likelyOriginalCount,
        likelyDuplicates,
        possibleDuplicates,
        pendingReview,
        confirmedDuplicates,
        dismissedFlags,
        modelName: 'MultiSignal-Forensics-v2.1',
        thresholds: {
          likely: Number(process.env.PHASH_LIKELY_THRESHOLD || 5),
          possible: Number(process.env.PHASH_POSSIBLE_THRESHOLD || 10),
          aiProbability: 0.65,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeImageHandler,
  verifyImageHandler,
  getMaterialAnalysis,
  getFlaggedImages,
  reviewFlaggedImage,
  syncMaterialsHandler,
  getAiStats,
};
