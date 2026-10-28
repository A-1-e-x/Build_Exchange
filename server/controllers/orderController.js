const Order = require('../models/Order');
const Material = require('../models/Material');
const Request = require('../models/Request');
const Notification = require('../models/Notification');
const Message = require('../models/Message');

// @desc    Create a new order (direct or from accepted request)
// @route   POST /api/orders
// @access  Private (Buyer/Seller/Admin)
const createOrder = async (req, res, next) => {
  try {
    const {
      materialId,
      quantity,
      requestId,
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

    if (!materialId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Material and quantity are required to place an order.',
      });
    }

    const material = await Material.findById(materialId).populate('sellerId');
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material listing not found.',
      });
    }

    if (material.status === 'sold' || material.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This material is sold out and unavailable for order.',
      });
    }

    const requestedQty = Number(quantity);
    if (requestedQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Order quantity must be at least 1.',
      });
    }

    if (requestedQty > material.quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${material.quantity} units are currently available.`,
      });
    }

    // Determine buyer & seller
    let buyerId = req.user._id;
    let sellerId = material.sellerId._id || material.sellerId;

    // If seller or admin is creating order on behalf of buyer from a request
    if (requestId) {
      const existingReq = await Request.findById(requestId);
      if (existingReq) {
        buyerId = existingReq.buyerId;
        sellerId = existingReq.sellerId;
      }
    }

    const unitPrice = material.price;
    const totalPrice = requestedQty * unitPrice;

    const newOrder = await Order.create({
      buyerId,
      sellerId,
      materialId: material._id,
      requestId: requestId || null,
      quantity: requestedQty,
      unitPrice,
      totalPrice,
      status: 'Pickup Scheduled',
      pickupAddress: pickupAddress || material.address,
      pickupCity: pickupCity || material.city,
      pickupDistrict: pickupDistrict || material.district || '',
      pickupPincode: pickupPincode || material.pincode || '',
      pickupLandmark: pickupLandmark || '',
      pickupDate: pickupDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      pickupStartTime: pickupStartTime || '10:00 AM',
      pickupEndTime: pickupEndTime || '01:00 PM',
      sellerMessage: sellerMessage || '',
      acceptedAt: new Date(),
      pickupScheduledAt: new Date(),
    });

    if (requestId) {
      await Request.findByIdAndUpdate(requestId, {
        status: 'accepted',
        orderId: newOrder._id,
        sellerNote: sellerMessage || '',
      });
    }

    // Create Notification for Buyer
    await Notification.create({
      userId: buyerId,
      type: 'pickup_scheduled',
      title: 'Order Created & Pickup Scheduled',
      message: `Pickup scheduled for ${newOrder.pickupDate} from ${newOrder.pickupStartTime} to ${newOrder.pickupEndTime}.`,
      relatedOrderId: newOrder._id,
      relatedRequestId: requestId || null,
    });

    if (sellerMessage && sellerMessage.trim()) {
      await Message.create({
        senderId: sellerId,
        receiverId: buyerId,
        orderId: newOrder._id,
        message: sellerMessage.trim(),
      });
    }

    const populatedOrder = await Order.findById(newOrder._id)
      .populate('materialId', 'name category price unit images address city district state pincode')
      .populate('sellerId', 'name email phone city state')
      .populate('buyerId', 'name email phone city state');

    res.status(201).json({
      success: true,
      message: 'Order created successfully with pickup schedule.',
      order: populatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders for logged-in buyer
// @route   GET /api/orders/my
// @access  Private (Buyer/Admin)
const getMyOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { buyerId: req.user._id };

    if (status && status !== 'all') {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('materialId', 'name category price unit images address city district state pincode quantity status')
      .populate('sellerId', 'name email phone city state')
      .populate('requestId', 'quantity message status');

    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders for logged-in seller
// @route   GET /api/orders/seller
// @access  Private (Seller/Admin)
const getSellerOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { sellerId: req.user._id };

    if (status && status !== 'all') {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('materialId', 'name category price unit images address city district state pincode quantity status')
      .populate('buyerId', 'name email phone city state profileImage')
      .populate('requestId', 'quantity message status');

    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private (Buyer/Seller/Admin)
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('materialId', 'name category price unit images address city district state pincode quantity status')
      .populate('sellerId', 'name email phone city state profileImage address')
      .populate('buyerId', 'name email phone city state profileImage address')
      .populate('requestId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Authorization check: only buyer, seller or admin can access
    const isBuyer = order.buyerId?._id?.toString() === req.user._id.toString();
    const isSeller = order.sellerId?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this order.',
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update pickup details for an order
// @route   PATCH /api/orders/:id/pickup
// @access  Private (Seller/Admin)
const updatePickupDetails = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Verify ownership
    if (order.sellerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update pickup details for this order.',
      });
    }

    if (order.status === 'Completed' || order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot update pickup details for an order that is already ${order.status.toLowerCase()}.`,
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

    if (pickupAddress) order.pickupAddress = pickupAddress;
    if (pickupCity) order.pickupCity = pickupCity;
    if (pickupDistrict !== undefined) order.pickupDistrict = pickupDistrict;
    if (pickupPincode !== undefined) order.pickupPincode = pickupPincode;
    if (pickupLandmark !== undefined) order.pickupLandmark = pickupLandmark;
    if (pickupDate) order.pickupDate = pickupDate;
    if (pickupStartTime) order.pickupStartTime = pickupStartTime;
    if (pickupEndTime) order.pickupEndTime = pickupEndTime;
    if (sellerMessage !== undefined) order.sellerMessage = sellerMessage;

    order.pickupScheduledAt = new Date();
    order.updatedAt = new Date();

    await order.save();

    // Notify Buyer about updated pickup schedule
    await Notification.create({
      userId: order.buyerId,
      type: 'pickup_updated',
      title: 'Pickup Schedule Updated',
      message: `Pickup schedule updated. New Date: ${order.pickupDate}, New Time: ${order.pickupStartTime} – ${order.pickupEndTime}. Location: ${order.pickupAddress}, ${order.pickupCity}`,
      relatedOrderId: order._id,
      relatedRequestId: order.requestId,
    });

    if (sellerMessage && sellerMessage.trim()) {
      await Message.create({
        senderId: req.user._id,
        receiverId: order.buyerId,
        orderId: order._id,
        message: `[Pickup Update]: ${sellerMessage.trim()}`,
      });
    }

    const updatedOrder = await Order.findById(order._id)
      .populate('materialId', 'name category price unit images address city district state pincode')
      .populate('sellerId', 'name email phone city state')
      .populate('buyerId', 'name email phone city state');

    res.json({
      success: true,
      message: 'Pickup details updated successfully.',
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark product "Ready for Pickup"
// @route   PATCH /api/orders/:id/ready
// @access  Private (Seller/Admin)
const markOrderReady = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    if (order.sellerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this order.',
      });
    }

    if (order.status === 'Completed' || order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot mark as ready for pickup because the order is ${order.status.toLowerCase()}.`,
      });
    }

    order.status = 'Ready for Pickup';
    order.readyAt = new Date();
    order.updatedAt = new Date();
    await order.save();

    const material = await Material.findById(order.materialId);

    // Notify Buyer
    await Notification.create({
      userId: order.buyerId,
      type: 'ready_for_pickup',
      title: 'Order Ready for Pickup',
      message: `Your order for ${order.quantity} ${material?.unit || 'units'} of ${material?.name || 'material'} is ready for pickup!`,
      relatedOrderId: order._id,
      relatedRequestId: order.requestId,
    });

    const updatedOrder = await Order.findById(order._id)
      .populate('materialId', 'name category price unit images address city district state pincode')
      .populate('sellerId', 'name email phone city state')
      .populate('buyerId', 'name email phone city state');

    res.json({
      success: true,
      message: 'Order marked as Ready for Pickup.',
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark order "Completed" - Product collected by buyer
//          AUTOMATIC QUANTITY REDUCTION & SOLD STATUS WITH RACE-CONDITION SAFETY
// @route   PATCH /api/orders/:id/complete
// @access  Private (Seller/Admin)
const completeOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Verify ownership
    if (order.sellerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to complete this order.',
      });
    }

    if (order.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'This order is already marked as completed.',
      });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete a cancelled order.',
      });
    }

    // Atomically transition order status to 'Completed' to lock against concurrent completion requests
    const lockedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        status: { $nin: ['Completed', 'Cancelled'] },
      },
      {
        $set: {
          status: 'Completed',
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!lockedOrder) {
      const refreshedOrder = await Order.findById(order._id);
      return res.status(400).json({
        success: false,
        message: refreshedOrder && refreshedOrder.status === 'Completed'
          ? 'This order is already marked as completed.'
          : 'Cannot complete order in its current status.',
      });
    }

    // Check Current Material Stock & Atomic update to subtract quantity securely
    const updatedMaterial = await Material.findOneAndUpdate(
      {
        _id: lockedOrder.materialId,
        quantity: { $gte: lockedOrder.quantity },
      },
      {
        $inc: { quantity: -lockedOrder.quantity },
      },
      { new: true }
    );

    if (!updatedMaterial) {
      // Rollback order status if stock was insufficient
      await Order.findByIdAndUpdate(lockedOrder._id, {
        status: order.status,
        completedAt: null,
        updatedAt: new Date(),
      });
      return res.status(400).json({
        success: false,
        message: `Insufficient quantity available. Current stock is less than ${lockedOrder.quantity}.`,
      });
    }

    // If remaining quantity reaches 0 -> Automatically mark listing as Sold
    if (updatedMaterial.quantity === 0) {
      updatedMaterial.status = 'sold';
      await updatedMaterial.save();
    }

    // Also update linked request if present
    if (lockedOrder.requestId) {
      await Request.findByIdAndUpdate(lockedOrder.requestId, {
        status: 'completed',
      });
    }

    // Notify Buyer
    await Notification.create({
      userId: order.buyerId,
      type: 'completed',
      title: 'Order Completed',
      message: `Your order for ${order.quantity} ${updatedMaterial.unit} of ${updatedMaterial.name} has been completed.`,
      relatedOrderId: order._id,
      relatedRequestId: order.requestId,
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('materialId', 'name category price unit images address city district state pincode quantity status')
      .populate('sellerId', 'name email phone city state')
      .populate('buyerId', 'name email phone city state');

    res.json({
      success: true,
      message: `Order completed successfully! Deducted ${order.quantity} ${updatedMaterial.unit}. Remaining stock: ${updatedMaterial.quantity} ${updatedMaterial.unit}.`,
      order: populatedOrder,
      material: {
        _id: updatedMaterial._id,
        quantity: updatedMaterial.quantity,
        status: updatedMaterial.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an order
// @route   PATCH /api/orders/:id/cancel
// @access  Private (Buyer/Seller/Admin)
const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    const isBuyer = order.buyerId.toString() === req.user._id.toString();
    const isSeller = order.sellerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this order.',
      });
    }

    if (order.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed orders cannot be cancelled.',
      });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled.',
      });
    }

    order.status = 'Cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason || 'Cancelled by ' + (isBuyer ? 'buyer' : 'seller');
    order.updatedAt = new Date();
    await order.save();

    if (order.requestId) {
      await Request.findByIdAndUpdate(order.requestId, {
        status: 'cancelled',
      });
    }

    // Notify the other party
    const targetUserId = isBuyer ? order.sellerId : order.buyerId;
    await Notification.create({
      userId: targetUserId,
      type: 'order_cancelled',
      title: 'Order Cancelled',
      message: `Order #${order._id.toString().slice(-6).toUpperCase()} was cancelled. Reason: ${order.cancellationReason}`,
      relatedOrderId: order._id,
      relatedRequestId: order.requestId,
    });

    const updatedOrder = await Order.findById(order._id)
      .populate('materialId', 'name category price unit images address city district state pincode')
      .populate('sellerId', 'name email phone city state')
      .populate('buyerId', 'name email phone city state');

    res.json({
      success: true,
      message: 'Order cancelled successfully.',
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get completed transactions for logged in user (or admin)
// @route   GET /api/orders/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    let filter = { status: 'Completed' };

    if (req.user.role === 'seller') {
      filter.sellerId = req.user._id;
    } else if (req.user.role === 'buyer') {
      filter.buyerId = req.user._id;
    } else if (req.user.role === 'admin') {
      // Admin sees all completed transactions
    }

    const transactions = await Order.find(filter)
      .sort({ completedAt: -1, createdAt: -1 })
      .populate('materialId', 'name category price unit images address city district state pincode')
      .populate('sellerId', 'name email phone city state')
      .populate('buyerId', 'name email phone city state');

    res.json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getOrderById,
  updatePickupDetails,
  markOrderReady,
  completeOrder,
  cancelOrder,
  getTransactions,
};
