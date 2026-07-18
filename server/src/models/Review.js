const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', trim: true, maxlength: 1000 },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Recompute a product's average rating + review count after any change.
reviewSchema.statics.recalcProduct = async function (productId) {
  const agg = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: '$product',
        avg: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const { avg = 0, count = 0 } = agg[0] || {};
  await mongoose.model('Product').findByIdAndUpdate(productId, {
    rating: Math.round(avg * 10) / 10,
    numReviews: count,
  });
};

module.exports = mongoose.model('Review', reviewSchema);
