require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const { cloudinary, cloudinaryEnabled } = require('./config/cloudinary');
const Product = require('./models/Product');

// Local seed images live in the client's public folder
const PUBLIC_DIR = path.join(__dirname, '..', '..', 'client', 'public');

async function run() {
  if (!cloudinaryEnabled) {
    console.error('Cloudinary is not configured. Add keys to .env first.');
    process.exit(1);
  }

  await connectDB(process.env.MONGODB_URI);

  const products = await Product.find({ imageUrl: { $regex: '^/products/' } });
  console.log(`Found ${products.length} products with local images to migrate.\n`);

  let migrated = 0;
  let failed = 0;

  for (const product of products) {
    const filePath = path.join(PUBLIC_DIR, product.imageUrl);
    if (!fs.existsSync(filePath)) {
      console.warn(`  ✗ ${product.name}: file not found (${product.imageUrl})`);
      failed++;
      continue;
    }
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'crosia_by_hand',
      });
      product.imageUrl = result.secure_url;
      await product.save();
      migrated++;
      console.log(`  ✓ ${product.name} -> ${result.secure_url}`);
    } catch (err) {
      failed++;
      console.warn(`  ✗ ${product.name}: ${err.message}`);
    }
  }

  console.log(`\nDone. Migrated: ${migrated}, Failed: ${failed}`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
