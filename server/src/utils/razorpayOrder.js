const Cart = require('../models/Cart');
const Order = require('../models/Order');
const User = require('../models/User');
const { sendOrderConfirmation } = require('./orderEmail');

async function fulfillRazorpayPayment({ razorpayOrderId, razorpayPaymentId, userId = null }) {
  const query = { razorpayOrderId };
  if (userId) {
    query.user = userId;
  }

  const order = await Order.findOne(query);
  if (!order) {
    return { ok: false, status: 404, message: 'Order not found' };
  }

  if (order.status === 'paid') {
    return { ok: true, order, alreadyPaid: true };
  }

  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: { $ne: 'paid' } },
    { status: 'paid', razorpayPaymentId },
    { new: true }
  );

  if (!updated) {
    const paidOrder = await Order.findById(order._id);
    return { ok: true, order: paidOrder, alreadyPaid: true };
  }

  await Cart.findOneAndUpdate({ user: order.user }, { items: [] });

  const user = await User.findById(order.user).select('email name');
  if (user?.email) {
    sendOrderConfirmation(updated, user.email, user.name);
  }

  return { ok: true, order: updated };
}

async function failRazorpayPayment({ razorpayOrderId, userId = null }) {
  const query = { razorpayOrderId };
  if (userId) {
    query.user = userId;
  }

  const order = await Order.findOne(query);
  if (!order) {
    return { ok: false, status: 404, message: 'Order not found' };
  }

  if (order.status === 'paid') {
    return { ok: true, order, alreadyPaid: true };
  }

  const updated = await Order.findOneAndUpdate(
    { ...query, status: { $ne: 'paid' } },
    { status: 'failed' },
    { new: true }
  );

  return { ok: true, order: updated };
}

module.exports = { fulfillRazorpayPayment, failRazorpayPayment };
