const express = require('express');
const crypto = require('crypto');
const { fulfillRazorpayPayment, failRazorpayPayment } = require('../utils/razorpayOrder');

const router = express.Router();
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

router.post('/razorpay', async (req, res) => {
  if (!webhookSecret) {
    return res.status(503).json({ message: 'Webhook secret not configured' });
  }

  const signature = req.headers['x-razorpay-signature'];
  if (!signature) {
    return res.status(400).json({ message: 'Missing signature' });
  }

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.body)
    .digest('hex');

  if (expected !== signature) {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).json({ message: 'Invalid JSON' });
  }

  try {
    const payment = event.payload?.payment?.entity;
    if (!payment?.order_id) {
      return res.status(200).json({ received: true });
    }

    if (event.event === 'payment.captured') {
      await fulfillRazorpayPayment({
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
      });
    } else if (event.event === 'payment.failed') {
      await failRazorpayPayment({ razorpayOrderId: payment.order_id });
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Razorpay webhook error:', err);
    return res.status(500).json({ message: 'Webhook handler failed' });
  }
});

module.exports = router;
