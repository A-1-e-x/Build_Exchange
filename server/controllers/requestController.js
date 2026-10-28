const Request = require('../models/Request');
const Material = require('../models/Material');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const Message = require('../models/Message');

// @desc    Create a new buyer enquiry/request
// @route   POST /api/requests
// @access  Private (Buyer/Admin)
const createRequest = async (req, res, next) => {
  try {
    const { materialId, quantity, message, contactPhone, contactEmail } = req.body;

    if (!materialId || !quantity || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide material, quantity, and a message.',
      });
    }

    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'The requested material listing does not exist.',
      });
    }

    // Prevent seller from submitting request to their own listing
    if (material.sellerId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a purchase request for your own listed material.',
      });
    }

    if (material.status === 'sold' || material.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This material is sold out and unavailable for purchase requests.',
      });
    }

    const requestedQuantity = Number(quantity);
    if (requestedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Requested quantity must be greater than zero.',
      });
    }

    // Validation: Exactly as required by Section 3
    if (requestedQuantity > material.quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${material.quantity} units are currently available.`,
      });
    }

    const newRequest = await Request.create({
      buyerId: req.user._id,
      sellerId: material.sellerId,
      materialId: material._id,
      quantity: requestedQuantity,
      message: message.trim(),
      contactPhone: contactPhone || req.user.phone || '',
      contactEmail: contactEmail || req.user.email || '',
      status: 'pending',
    });

    // Notify seller
    await Notification.create({
      userId: material.sellerId,
      type: 'new_request',
      title: 'New Purchase Request',
      message: `${req.user.name} requested ${requestedQuantity} ${material.unit} of ${material.name}.`,
      relatedRequestId: newRequest._id,
    });

    const populatedRequest = await Request.findById(newRequest._id)
      .populate('materialId', 'name category price unit images address city state quantity status')
      .populate('sellerId', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Purchase request sent to seller successfully!',
      request: populatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all requests made by logged in buyer
// @route   GET /api/requests/my
// @access  Private
const getMyRequests = async (req, res, next) => {
  try {
    const requests = await Request.find({ buyerId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('materialId', 'name category price unit images address city state status quantity')
      .populate('sellerId', 'name email phone city state')
      .populate('orderId');

    res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all requests received by seller for their materials
// @route   GET /api/requests/received
// @access  Private (Seller/Admin)
const getReceivedRequests = async (req, res, next) => {
  try {
    const requests = await Request.find({ sellerId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('materialId', 'name category price unit images address city state status quantity')
      .populate('buyerId', 'name email phone city state profileImage')
      .populate('orderId');

    res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Seller accepts purchase request and schedules pickup
// @route   PATCH /api/requests/:id/accept
// @access  Private (Seller/Admin)
const acceptRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('materialId')
      .populate('buyerId');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.',
      });
    }

    if (
      request.sellerId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to accept this request.',
      });
    }

    if (request.status === 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been accepted.',
      });
    }

    const material = request.materialId;
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material listing no longer exists.',
      });
    }

    // Verify current available quantity
    if (material.quantity < request.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient quantity available. Current stock: ${material.quantity}, Requested: ${request.quantity}`,
      });
    }

    const {
      pickupAddress,
      pickupCity,
      pickupDistrict,
      pickupPincode,
      pickupLandmark,
      pickupDate,
      pickupStartTime,
      pickupEndTime,
      sellerMessage,
    } = req.body;

    if (!pickupAddress || !pickupCity || !pickupDate || !pickupStartTime || !pickupEndTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide complete pickup details: address, city, date, start time, and end time.',
      });
    }

    // Atomically lock and transition request from 'pending' to 'accepted'
    const lockedRequest = await Request.findOneAndUpdate(
      {
        _id: req.params.id,
        status: 'pending',
      },
      {
        $set: {
          status: 'accepted',
          sellerNote: sellerMessage || 'Pickup scheduled',
        },
      },
      { new: true }
    );

    if (!lockedRequest) {
      const refreshedReq = await Request.findById(req.params.id);
      return res.status(400).json({
        success: false,
        message: refreshedReq && refreshedReq.status === 'accepted'
          ? 'This request has already been accepted.'
          : 'Cannot accept request in its current status.',
      });
    }

    const unitPrice = material.price;
    const totalPrice = request.quantity * unitPrice;

    // Create Order with Pickup Scheduled status
    // NOTE: DO NOT reduce material quantity yet! Only reduced on order completion.
    let newOrder;
    try {
      newOrder = await Order.create({
        buyerId: request.buyerId._id,
        sellerId: request.sellerId,
        materialId: material._id,
        requestId: request._id,
        quantity: request.quantity,
        unitPrice,
        totalPrice,
        status: 'Pickup Scheduled',
        pickupAddress: pickupAddress.trim(),
        pickupCity: pickupCity.trim(),
        pickupDistrict: (pickupDistrict || material.district || '').trim(),
        pickupPincode: (pickupPincode || material.pincode || '').trim(),
        pickupLandmark: (pickupLandmark || '').trim(),
        pickupDate: pickupDate.trim(),
        pickupStartTime: pickupStartTime.trim(),
        pickupEndTime: pickupEndTime.trim(),
        sellerMessage: (sellerMessage || '').trim(),
        acceptedAt: new Date(),
        pickupScheduledAt: new Date(),
      });
    } catch (orderErr) {
      // Revert request status if order creation failed
      await Request.findByIdAndUpdate(lockedRequest._id, {
        status: 'pending',
        sellerNote: '',
      });
      throw orderErr;
    }

    // Link created order to request
    lockedRequest.orderId = newOrder._id;
    await lockedRequest.save();

    // Create Buyer Notification
    await Notification.create({
      userId: request.buyerId._id,
      type: 'request_accepted',
      title: 'Request Accepted & Pickup Scheduled',
      message: `Your purchase request for ${material.name} has been accepted. Pickup details have been provided by the seller.`,
      relatedOrderId: newOrder._id,
      relatedRequestId: request._id,
    });

    // If sellerMessage provided, store in Message collection
    if (sellerMessage && sellerMessage.trim()) {
      await Message.create({
        senderId: req.user._id,
        receiverId: request.buyerId._id,
        orderId: newOrder._id,
        message: sellerMessage.trim(),
      });
    }

    const populatedOrder = await Order.findById(newOrder._id)
      .populate('materialId', 'name category price unit images address city district state pincode')
      .populate('sellerId', 'name email phone city state')
      .populate('buyerId', 'name email phone city state');

    res.json({
      success: true,
      message: 'Request accepted and pickup scheduled successfully!',
      order: populatedOrder,
      request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Seller rejects purchase request
// @route   PATCH /api/requests/:id/reject
// @access  Private (Seller/Admin)
const rejectRequest = async (req, res, next) => {
  try {
    const { sellerNote } = req.body;
    const request = await Request.findById(req.params.id).populate('materialId');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.',
      });
    }

    if (
      request.sellerId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reject this request.',
      });
    }

    request.status = 'rejected';
    if (sellerNote) {
      request.sellerNote = sellerNote.trim();
    }
    await request.save();

    // Notify Buyer
    await Notification.create({
      userId: request.buyerId,
      type: 'request_rejected',
      title: 'Request Declined',
      message: `Your purchase request for ${request.materialId?.name || 'material'} was declined by the seller.${sellerNote ? ` Reason: ${sellerNote}` : ''}`,
      relatedRequestId: request._id,
    });

    res.json({
      success: true,
      message: 'Request has been rejected.',
      request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Legacy update request status (accept, reject, completed)
// @route   PATCH /api/requests/:id/status
// @access  Private (Seller/Admin)
const updateRequestStatus = async (req, res, next) => {
  try {
    const { status, sellerNote } = req.body;

    if (!['pending', 'accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request status.',
      });
    }

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.',
      });
    }

    if (
      request.sellerId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this request.',
      });
    }

    request.status = status;
    if (sellerNote !== undefined) {
      request.sellerNote = sellerNote;
    }

    await request.save();

    const updatedRequest = await Request.findById(request._id)
      .populate('materialId', 'name category price unit images address city state status')
      .populate('buyerId', 'name email phone city state')
      .populate('sellerId', 'name email phone');

    res.json({
      success: true,
      message: `Request status updated to '${status}'.`,
      request: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getReceivedRequests,
  acceptRequest,
  rejectRequest,
  updateRequestStatus,
};
