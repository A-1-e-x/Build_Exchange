const Message = require('../models/Message');
const Order = require('../models/Order');
const Notification = require('../models/Notification');

// @desc    Send a message regarding an order
// @route   POST /api/messages
// @access  Private (Buyer/Seller/Admin)
const sendMessage = async (req, res, next) => {
  try {
    const { orderId, message } = req.body;

    if (!orderId || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and message content are required.',
      });
    }

    const order = await Order.findById(orderId);
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
        message: 'You are not authorized to send messages for this order.',
      });
    }

    // Determine receiver
    const receiverId = isBuyer ? order.sellerId : order.buyerId;

    const newMessage = await Message.create({
      senderId: req.user._id,
      receiverId,
      orderId: order._id,
      message: message.trim(),
    });

    // Notify receiver
    await Notification.create({
      userId: receiverId,
      type: 'message',
      title: 'New Order Message',
      message: `${req.user.name}: "${message.trim().slice(0, 80)}${message.trim().length > 80 ? '...' : ''}"`,
      relatedOrderId: order._id,
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'name email role profileImage')
      .populate('receiverId', 'name email role profileImage');

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all messages for an order
// @route   GET /api/messages/order/:orderId
// @access  Private (Buyer/Seller/Admin)
const getOrderMessages = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
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
        message: 'You are not authorized to view messages for this order.',
      });
    }

    const messages = await Message.find({ orderId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name email role profileImage')
      .populate('receiverId', 'name email role profileImage');

    // Mark messages addressed to logged-in user as read
    await Message.updateMany(
      { orderId, receiverId: req.user._id, read: false },
      { read: true }
    );

    res.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark single message as read
// @route   PATCH /api/messages/:id/read
// @access  Private
const markMessageRead = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found.',
      });
    }

    if (message.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized.',
      });
    }

    message.read = true;
    await message.save();

    res.json({
      success: true,
      message: 'Message marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getOrderMessages,
  markMessageRead,
};
