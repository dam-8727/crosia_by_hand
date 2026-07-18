const express = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Order = require('../models/Order');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Limit review writes per user (falls back to IP if somehow unauthenticated).
const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req.ip),
  message: { message: 'Too many review submissions. Please try again later.' },
});

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function uniqueSlug(base, excludeId = null) {
  let slug = base || 'product';
  let n = 1;
  // Ensure slug uniqueness (append -1, -2, ... if needed)
  while (true) {
    const existing = await Product.findOne({ slug });
    if (!existing || (excludeId && existing._id.toString() === excludeId)) {
      return slug;
    }
    slug = `${base}-${n++}`;
  }
}

// GET /api/products?category=Decor&search=basket
router.get('/', async (req, res) => {
  const { category, search } = req.query;
  const filter = {};
  if (category && category !== 'All') {
    filter.category = category;
  }
  if (search) {
    filter.name = { $regex: String(search).trim(), $options: 'i' };
  }
  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json({ products, categories: Product.CATEGORIES });
});

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json({ product });
});

// ---- Reviews ----

// GET /api/products/:slug/reviews  -> all reviews for a product (newest first)
router.get('/:slug/reviews', async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).select('_id');
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  const reviews = await Review.find({ product: product._id }).sort({ createdAt: -1 });
  res.json({ reviews });
});

// POST /api/products/:slug/reviews  -> add or update the logged-in user's review
router.post(
  '/:slug/reviews',
  protect,
  reviewLimiter,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment too long'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const product = await Product.findOne({ slug: req.params.slug }).select('_id');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { rating, comment } = req.body;

    // Mark as a verified purchase if the user has an order containing this product.
    const purchased = await Order.exists({
      user: req.user._id,
      'items.product': product._id,
      status: { $in: ['paid', 'shipped', 'delivered', 'cod_pending'] },
    });

    const review = await Review.findOneAndUpdate(
      { product: product._id, user: req.user._id },
      {
        product: product._id,
        user: req.user._id,
        name: req.user.name,
        rating,
        comment: comment || '',
        verified: Boolean(purchased),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await Review.recalcProduct(product._id);

    res.status(201).json({ review });
  }
);

// DELETE /api/products/:slug/reviews  -> remove the logged-in user's own review
router.delete('/:slug/reviews', protect, reviewLimiter, async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).select('_id');
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const deleted = await Review.findOneAndDelete({
    product: product._id,
    user: req.user._id,
  });
  if (!deleted) {
    return res.status(404).json({ message: 'Review not found' });
  }

  await Review.recalcProduct(product._id);

  res.json({ message: 'Review deleted' });
});

// ---- Admin-only routes below ----

const productValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('category').isIn(Product.CATEGORIES).withMessage('Invalid category'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('imageUrl').trim().notEmpty().withMessage('Image URL is required'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be 0 or more'),
];

// POST /api/products  (admin)
router.post('/', protect, adminOnly, productValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { name, category, price, description, color, material, stock, imageUrl } = req.body;
  const slug = await uniqueSlug(slugify(name));

  const product = await Product.create({
    name,
    slug,
    category,
    price,
    description: description || '',
    color: color || '',
    material: material || 'Handmade crochet',
    stock: stock ?? 10,
    imageUrl,
  });

  res.status(201).json({ product });
});

// PUT /api/products/:id  (admin)
router.put('/:id', protect, adminOnly, productValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const { name, category, price, description, color, material, stock, imageUrl } = req.body;

  if (name && name !== product.name) {
    product.slug = await uniqueSlug(slugify(name), product._id.toString());
  }
  product.name = name;
  product.category = category;
  product.price = price;
  product.description = description ?? product.description;
  product.color = color ?? product.color;
  product.material = material ?? product.material;
  product.stock = stock ?? product.stock;
  product.imageUrl = imageUrl;
  await product.save();

  res.json({ product });
});

// DELETE /api/products/:id  (admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json({ message: 'Product deleted' });
});

module.exports = router;
