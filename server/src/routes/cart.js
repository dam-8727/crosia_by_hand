const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

async function getPopulatedCart(userId) {
  let cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    cart = await cart.populate('items.product');
  }
  return cart;
}

function serializeCart(cart) {
  const items = cart.items
    .filter((i) => i.product)
    .map((i) => ({
      product: {
        id: i.product._id,
        name: i.product.name,
        slug: i.product.slug,
        price: i.product.price,
        imageUrl: i.product.imageUrl,
        category: i.product.category,
        stock: i.product.stock,
      },
      qty: i.qty,
      lineTotal: i.qty * i.product.price,
    }));
  const total = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);
  return { items, total, count };
}

// All cart routes require login
router.use(protect);

// GET /api/cart
router.get('/', async (req, res) => {
  const cart = await getPopulatedCart(req.user._id);
  res.json({ cart: serializeCart(cart) });
});

// POST /api/cart  { productId, qty }
router.post('/', async (req, res) => {
  const { productId, qty = 1 } = req.body;
  const quantity = Math.max(1, parseInt(qty, 10) || 1);

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const existing = cart.items.find((i) => i.product.toString() === productId);
  if (existing) {
    existing.qty += quantity;
  } else {
    cart.items.push({ product: productId, qty: quantity });
  }
  await cart.save();

  const populated = await getPopulatedCart(req.user._id);
  res.status(201).json({ cart: serializeCart(populated) });
});

// PUT /api/cart/:productId  { qty }
router.put('/:productId', async (req, res) => {
  const { qty } = req.body;
  const quantity = parseInt(qty, 10);

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  const item = cart.items.find((i) => i.product.toString() === req.params.productId);
  if (!item) {
    return res.status(404).json({ message: 'Item not in cart' });
  }

  if (quantity <= 0) {
    cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  } else {
    item.qty = quantity;
  }
  await cart.save();

  const populated = await getPopulatedCart(req.user._id);
  res.json({ cart: serializeCart(populated) });
});

// DELETE /api/cart/:productId
router.delete('/:productId', async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
    await cart.save();
  }
  const populated = await getPopulatedCart(req.user._id);
  res.json({ cart: serializeCart(populated) });
});

module.exports = router;
