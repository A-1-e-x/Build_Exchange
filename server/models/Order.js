const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer reference is required'],
      index: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller reference is required'],
      index: true,
    },
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      required: [true, 'Material reference is required'],
      index: true,
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Purchased quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative'],
    },
    status: {
      type: String,
      enum: [
        'Pending',
        'Accepted',
        'Pickup Scheduled',
        'Ready for Pickup',
        'Completed',
        'Cancelled',
      ],
      default: 'Pickup Scheduled',
      index: true,
    },
    pickupAddress: {
      type: String,
      required: [true, 'Pickup address is required'],
      trim: true,
    },
    pickupCity: {
      type: String,
      required: [true, 'Pickup city is required'],
      trim: true,
    },
    pickupDistrict: {
      type: String,
      default: '',
      trim: true,
    },
    pickupPincode: {
      type: String,
      default: '',
      trim: true,
    },
    pickupLandmark: {
      type: String,
      default: '',
      trim: true,
    },
    pickupDate: {
      type: String,
      required: [true, 'Pickup date is required'],
      trim: true,
    },
    pickupStartTime: {
      type: String,
      required: [true, 'Pickup start time is required'],
      trim: true,
    },
    pickupEndTime: {
      type: String,
      required: [true, 'Pickup end time is required'],
      trim: true,
    },
    sellerMessage: {
      type: String,
      default: '',
      trim: true,
    },
    acceptedAt: {
      type: Date,
      default: Date.now,
    },
    pickupScheduledAt: {
      type: Date,
      default: Date.now,
    },
    readyAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
