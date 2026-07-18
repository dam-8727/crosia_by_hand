const mongoose = require('mongoose');

const CATEGORIES = ['Decor', 'Storage', 'Living', 'Wear & Carry'];

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: String, required: true, enum: CATEGORIES },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
    color: { type: String, default: '' },
    material: { type: String, default: 'Handmade crochet' },
    stock: { type: Number, default: 10, min: 0 },
    imageUrl: { type: String, required: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
module.exports.CATEGORIES = CATEGORIES;
