const Material = require('../models/Material');
const ImageAnalysis = require('../models/ImageAnalysis');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const { indexMaterialImages } = require('../services/aiImageService');

// @desc    Get all materials with dynamic search, multi-filter, sort & pagination
// @route   GET /api/materials
// @access  Public
const getMaterials = async (req, res, next) => {
  try {
    const {
      search,
      category,
      condition,
      minPrice,
      maxPrice,
      city,
      district,
      state,
      status,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isApproved: true };

    // Availability status filter (default to 'available' for public browse)
    if (status && status !== 'all') {
      query.status = status;
    } else if (!status) {
      query.status = 'available';
    }

    // Dynamic search across name, category, description, and location
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { category: searchRegex },
        { description: searchRegex },
        { city: searchRegex },
        { district: searchRegex },
        { state: searchRegex },
      ];
    }

    // Category filter
    if (category && category !== 'All' && category !== 'all') {
      query.category = category;
    }

    // Condition filter
    if (condition && condition !== 'All' && condition !== 'all') {
      query.condition = condition;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Location filters
    if (city && city.trim() !== '') {
      query.city = new RegExp(city.trim(), 'i');
    }
    if (district && district.trim() !== '') {
      query.district = new RegExp(district.trim(), 'i');
    }
    if (state && state.trim() !== '') {
      query.state = new RegExp(state.trim(), 'i');
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // Default: Newest first
    if (sort === 'price-asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price-desc') {
      sortOption = { price: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'popular') {
      sortOption = { views: -1 };
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const totalMaterials = await Material.countDocuments(query);
    const materials = await Material.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .populate('sellerId', 'name email phone city state profileImage');

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

// @desc    Get featured materials for home page
// @route   GET /api/materials/featured
// @access  Public
const getFeaturedMaterials = async (req, res, next) => {
  try {
    const materials = await Material.find({
      isApproved: true,
      status: 'available',
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('sellerId', 'name city state profileImage');

    res.json({
      success: true,
      materials,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get materials listed by currently logged in seller
// @route   GET /api/materials/my
// @access  Private (Seller/Admin)
const getMyMaterials = async (req, res, next) => {
  try {
    const materials = await Material.find({ sellerId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('sellerId', 'name email phone');

    res.json({
      success: true,
      count: materials.length,
      materials,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single material by ID
// @route   GET /api/materials/:id
// @access  Public
const getMaterialById = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id).populate(
      'sellerId',
      'name email phone city district state profileImage createdAt'
    );

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material listing not found.',
      });
    }

    // Increment view count asynchronously
    material.views = (material.views || 0) + 1;
    await material.save();

    res.json({
      success: true,
      material,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new material listing
// @route   POST /api/materials
// @access  Private (Seller/Admin)
const createMaterial = async (req, res, next) => {
  try {
    const {
      name,
      category,
      description,
      quantity,
      unit,
      condition,
      price,
      address,
      city,
      district,
      state,
      pincode,
      contactPhone,
      imageUrl, // Optional fallback image url if passed directly
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !category ||
      !description ||
      quantity === undefined ||
      !unit ||
      !condition ||
      price === undefined ||
      !address ||
      !city ||
      !district ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required material listing fields.',
      });
    }

    const uploadedImages = [];

    // Process uploaded file(s) via multer
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await uploadImage(file, 'construction_materials');
        uploadedImages.push({
          url: uploadResult.url,
          public_id: uploadResult.public_id,
        });
      }
    } else if (imageUrl) {
      // Fallback image url support
      uploadedImages.push({
        url: imageUrl,
        public_id: 'manual_' + Date.now(),
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image of the material.',
      });
    }

    const newMaterial = await Material.create({
      sellerId: req.user._id,
      name,
      category,
      description,
      quantity: Number(quantity),
      unit,
      condition,
      price: Number(price),
      images: uploadedImages,
      address,
      city,
      district,
      state,
      pincode,
      contactPhone: contactPhone || req.user.phone,
      status: 'available',
      isApproved: true, // Default active/approved for frictionless user experience
    });

    // Automatically & idempotently index images for AI duplicate detection
    let aiAnalysisResults = [];
    try {
      aiAnalysisResults = await indexMaterialImages(newMaterial, req.user._id);
    } catch (aiErr) {
      console.warn('[AI Indexing Warning]: Non-fatal error indexing images:', aiErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Material listing created successfully!',
      material: newMaterial,
      aiAnalysis: aiAnalysisResults,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a material listing
// @route   PUT /api/materials/:id
// @access  Private (Seller/Admin)
const updateMaterial = async (req, res, next) => {
  try {
    let material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material listing not found.',
      });
    }

    // Verify ownership or admin
    if (
      material.sellerId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this material listing.',
      });
    }

    const {
      name,
      category,
      description,
      quantity,
      unit,
      condition,
      price,
      address,
      city,
      district,
      state,
      pincode,
      contactPhone,
      status,
      existingImages, // JSON array of preserved images
    } = req.body;

    if (name) material.name = name;
    if (category) material.category = category;
    if (description) material.description = description;
    if (quantity !== undefined) material.quantity = Number(quantity);
    if (unit) material.unit = unit;
    if (condition) material.condition = condition;
    if (price !== undefined) material.price = Number(price);
    if (address) material.address = address;
    if (city) material.city = city;
    if (district) material.district = district;
    if (state) material.state = state;
    if (pincode) material.pincode = pincode;
    if (contactPhone !== undefined) material.contactPhone = contactPhone;
    if (status) material.status = status;

    // Handle images
    let updatedImagesList = [];
    if (existingImages) {
      try {
        updatedImagesList = typeof existingImages === 'string'
          ? JSON.parse(existingImages)
          : existingImages;
      } catch (e) {
        updatedImagesList = material.images;
      }
    } else {
      updatedImagesList = [...material.images];
    }

    // Add newly uploaded files if any
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await uploadImage(file, 'construction_materials');
        updatedImagesList.push({
          url: uploadResult.url,
          public_id: uploadResult.public_id,
        });
      }
    }

    // Clean up any images that were removed during update
    if (existingImages && material.images && material.images.length > 0) {
      const preservedPublicIds = new Set(
        updatedImagesList.map((img) => img.public_id).filter(Boolean)
      );
      for (const oldImg of material.images) {
        if (oldImg.public_id && !preservedPublicIds.has(oldImg.public_id)) {
          try {
            await deleteImage(oldImg.public_id);
          } catch (delErr) {
            console.warn('[Cloudinary Cleanup Warning]: Failed to delete removed image:', delErr.message);
          }
        }
      }
    }

    if (updatedImagesList.length > 0) {
      material.images = updatedImagesList;
    }

    const updatedMaterial = await material.save();

    // Re-index any new/updated images for AI duplicate detection
    let aiAnalysisResults = [];
    try {
      aiAnalysisResults = await indexMaterialImages(updatedMaterial, req.user._id);
    } catch (aiErr) {
      console.warn('[AI Indexing Warning]: Non-fatal error re-indexing images:', aiErr.message);
    }

    res.json({
      success: true,
      message: 'Material listing updated successfully!',
      material: updatedMaterial,
      aiAnalysis: aiAnalysisResults,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a material listing
// @route   DELETE /api/materials/:id
// @access  Private (Seller/Admin)
const deleteMaterial = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material listing not found.',
      });
    }

    // Verify ownership or admin
    if (
      material.sellerId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this material listing.',
      });
    }

    // Delete images
    if (material.images && material.images.length > 0) {
      for (const img of material.images) {
        if (img.public_id) {
          await deleteImage(img.public_id);
        }
      }
    }

    // Clean up associated AI analysis records
    try {
      await ImageAnalysis.deleteMany({ materialId: material._id });
    } catch (cleanErr) {
      console.warn('[AI Cleanup Warning]: Could not remove analysis records:', cleanErr.message);
    }

    await material.deleteOne();

    res.json({
      success: true,
      message: 'Material listing deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle material status (available / sold)
// @route   PATCH /api/materials/:id/status
// @access  Private (Seller/Admin)
const toggleMaterialStatus = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material listing not found.',
      });
    }

    if (
      material.sellerId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this listing status.',
      });
    }

    const { status } = req.body;
    if (status && ['available', 'sold'].includes(status)) {
      material.status = status;
    } else {
      // Toggle
      material.status = material.status === 'available' ? 'sold' : 'available';
    }

    await material.save();

    res.json({
      success: true,
      message: `Listing marked as ${material.status}.`,
      status: material.status,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMaterials,
  getFeaturedMaterials,
  getMyMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  toggleMaterialStatus,
};
