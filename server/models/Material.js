const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const materialSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide material name'],
      trim: true,
      maxlength: [120, 'Material name cannot exceed 120 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide material description'],
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    quantity: {
      type: Number,
      required: [true, 'Please specify available quantity'],
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      required: [true, 'Please specify quantity unit (e.g. Bags, Pieces, Sq.Ft, Kg, Tons)'],
      trim: true,
    },
    condition: {
      type: String,
      required: [true, 'Please select material condition'],
      enum: {
        values: ['New', 'Like New', 'Good', 'Used', 'Damaged'],
        message: '{VALUE} is not a supported condition',
      },
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Please specify price (INR)'],
      min: [0, 'Price cannot be negative'],
      index: true,
    },
    images: {
      type: [imageSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'At least one image is required for the listing',
      },
    },
    address: {
      type: String,
      required: [true, 'Please provide address or site location'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'Please provide city'],
      trim: true,
      index: true,
    },
    district: {
      type: String,
      required: [true, 'Please provide district'],
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: [true, 'Please provide state'],
      trim: true,
      index: true,
    },
    pincode: {
      type: String,
      required: [true, 'Please provide postal pincode'],
      trim: true,
      match: [/^[0-9]{6}$/, 'Please provide a valid 6-digit postal pincode'],
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['available', 'sold'],
      default: 'available',
      index: true,
    },
    isApproved: {
      type: Boolean,
      default: true,
      index: true,
    },
    verificationSummary: {
      status: {
        type: String,
        enum: [
          'LIKELY_ORIGINAL',
          'POSSIBLY_DOWNLOADED',
          'POSSIBLY_AI_GENERATED',
          'DUPLICATE_DETECTED',
          'MANUAL_REVIEW_REQUIRED',
          'VERIFICATION_UNAVAILABLE',
        ],
        default: 'LIKELY_ORIGINAL',
      },
      origin: {
        type: String,
        enum: ['camera_captured', 'web_downloaded', 'ai_generated', 'duplicate', 'unknown'],
        default: 'camera_captured',
      },
      riskScore: {
        type: Number,
        default: 0,
      },
      aiGeneratedScore: {
        type: Number,
        default: null,
      },
      duplicateMatch: {
        type: Boolean,
        default: false,
      },
      checkedAt: {
        type: Date,
        default: null,
      },
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for powerful fuzzy dynamic search across name, category, description, and location
materialSchema.index({
  name: 'text',
  category: 'text',
  description: 'text',
  city: 'text',
  district: 'text',
  state: 'text',
});

module.exports = mongoose.model('Material', materialSchema);
