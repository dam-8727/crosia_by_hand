const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts. Try again later.' },
});

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

router.post(
  '/register',
  authLimiter,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    const token = signToken(user);
    return res.status(201).json({ token, user: publicUser(user) });
  }
);

router.post(
  '/login',
  authLimiter,
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);
    return res.json({ token, user: publicUser(user) });
  }
);

router.get('/me', protect, (req, res) => {
  return res.json({ user: publicUser(req.user) });
});

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// POST /api/auth/forgot  { email }
// Demo mode: no email service, so we return the reset token/link in the response.
// In production this token would be emailed to the user instead.
router.post(
  '/forgot',
  authLimiter,
  body('email').isEmail().withMessage('Valid email is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always respond success to avoid leaking which emails exist.
    if (!user) {
      return res.json({
        message: 'If that email exists, a reset link has been generated.',
      });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = hashToken(rawToken);
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${clientUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(
      user.email
    )}`;

    return res.json({
      message: 'Reset link generated. (Demo mode: link shown below instead of email.)',
      demo: true,
      resetLink,
      expiresInMinutes: 15,
    });
  }
);

// POST /api/auth/reset  { email, token, password }
router.post(
  '/reset',
  authLimiter,
  body('email').isEmail().withMessage('Valid email is required'),
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, token, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.resetTokenHash || !user.resetTokenExpiry) {
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }

    if (user.resetTokenExpiry.getTime() < Date.now()) {
      return res.status(400).json({ message: 'Reset link has expired. Please request again.' });
    }

    if (hashToken(token) !== user.resetTokenHash) {
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetTokenHash = null;
    user.resetTokenExpiry = null;
    await user.save();

    return res.json({ message: 'Password updated. You can now log in.' });
  }
);

module.exports = router;
