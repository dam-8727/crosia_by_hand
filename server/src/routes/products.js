const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

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
