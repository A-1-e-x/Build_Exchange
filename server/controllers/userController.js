const User = require('../models/User');
const { uploadImage } = require('../config/cloudinary');

// @desc    Get logged in user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update logged in user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      name,
      phone,
      address,
      city,
      district,
      state,
      pincode,
      password,
    } = req.body; 

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;
    if (district !== undefined) user.district = district;
    if (state !== undefined) user.state = state;
    if (pincode !== undefined) user.pincode = pincode;

    if (password && password.trim().length >= 6) {
      user.password = password;
    }

    // Check if an avatar image file was uploaded
    if (req.file) {
      const uploadResult = await uploadImage(req.file, 'user_avatars');
      user.profileImage = uploadResult.url;
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        address: updatedUser.address,
        city: updatedUser.city,
        district: updatedUser.district,
        state: updatedUser.state,
        pincode: updatedUser.pincode,
        profileImage: updatedUser.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
};
