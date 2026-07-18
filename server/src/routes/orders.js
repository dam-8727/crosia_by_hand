const express = require('express');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const Razorpay = require('razorpay');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { protect, adminOnly } = require('../middleware/auth');
const { sendOrderConfirmation, sendStatusUpdate } = require('../utils/orderEmail');
const { fulfillRazorpayPayment, failRazorpayPayment } = require('../utils/razorpayOrder');

const router = express.Router();

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const razorpayEnabled = Boolean(keyId && keySecret);

const razorpay = razorpayEnabled
  ? new Razorpay({ key_id: keyId, key_secret: keySecret })
  : null;

// Build order items + amount from the DB cart (server-side, never trust client totals)
async function buildOrderFromCart(userId) {
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  const validItems = (cart?.items || []).filter((i) => i.product);
  if (validItems.length === 0) {
    return { error: 'Your cart is empty' };
  }

  const items = validItems.map((i) => ({
    product: i.product._id,
    name: i.product.name,
    price: i.product.price,
    qty: i.qty,
    imageUrl: i.product.imageUrl,
  }));
  const amount = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  return { items, amount, cart };
}

const shippingValidators = [
  body('shipping.fullName').trim().notEmpty().withMessage('Full name is required'),
  body('shipping.phone').trim().matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone required'),
  body('shipping.address').trim().notEmpty().withMessage('Address is required'),
  body('shipping.city').trim().notEmpty().withMessage('City is required'),
  body('shipping.pincode').trim().matches(/^[0-9]{6}$/).withMessage('Valid 6-digit pincode required'),
];

router.use(protect);

// Tells the frontend which payment mode is available + the public key
router.get('/config', (_req, res) => {
  res.json({ razorpayEnabled, keyId: razorpayEnabled ? keyId : null });
});

// POST /api/orders/create  -> creates a pending order (+ Razorpay order if enabled)
router.post('/create', shippingValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { items, amount, error } = await buildOrderFromCart(req.user._id);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const { shipping } = req.body;

  if (razorpayEnabled) {
    const rpOrder = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });

    const order = await Order.create({
      user: req.user._id,
      items,
      amount,
      shipping,
      paymentMethod: 'razorpay',
      razorpayOrderId: rpOrder.id,
      status: 'created',
    });

    return res.status(201).json({
      mode: 'razorpay',
      keyId,
      razorpayOrderId: rpOrder.id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      orderId: order._id,
    });
  }

  // Fallback: Cash on Delivery (no keys configured)
  const order = await Order.create({
    user: req.user._id,
    items,
    amount,
    shipping,
    paymentMethod: 'cod',
    status: 'cod_pending',
  });

  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

  sendOrderConfirmation(order, req.user.email, req.user.name);

  return res.status(201).json({ mode: 'cod', orderId: order._id });
});

// POST /api/orders/verify  -> verify Razorpay signature and mark paid
router.post('/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpayEnabled) {
    return res.status(400).json({ message: 'Razorpay is not configured' });
  }
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: 'Missing payment fields' });
  }

  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expected !== razorpay_signature) {
    await failRazorpayPayment({
      razorpayOrderId: razorpay_order_id,
      userId: req.user._id,
    });
    return res.status(400).json({ message: 'Payment verification failed' });
  }

  const result = await fulfillRazorpayPayment({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    userId: req.user._id,
  });

  if (!result.ok) {
    return res.status(result.status).json({ message: result.message });
  }

  res.json({ success: true, orderId: result.order._id });
});

// ---- Admin-only routes ----

// GET /api/orders/admin/all  -> every order (admin)
router.get('/admin/all', adminOnly, async (req, res) => {
  const orders = await Order.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
  res.json({ orders });
});

// PATCH /api/orders/admin/:id/status  -> update fulfillment status (admin)
router.patch('/admin/:id/status', adminOnly, async (req, res) => {
  const allowed = ['paid', 'shipped', 'delivered', 'cod_pending', 'failed'];
  const { status } = req.body;
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).populate('user', 'name email');
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (order.user?.email) {
    sendStatusUpdate(order, order.user.email, order.user.name, status);
  }

  res.json({ order });
});

// GET /api/orders  -> current user's order history
router.get('/', async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ orders });
});

// GET /api/orders/:id  -> single order (must belong to user)
router.get('/:id', async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  res.json({ order });
});

module.exports = router;
