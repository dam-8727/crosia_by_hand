const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

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

module.exports = router;
