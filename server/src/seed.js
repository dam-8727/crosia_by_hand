require('dotenv').config();
const { connectDB } = require('./config/db');
const mongoose = require('mongoose');
const Product = require('./models/Product');

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// image = filename in client/public/products/
const raw = [
  // ---------- Decor ----------
  { name: 'Macrame Wall Hanging', category: 'Decor', price: 899, image: 'wall_hanging_1.png', color: 'Ivory', description: 'Handwoven crochet wall hanging to add cozy texture to any room.' },
  { name: 'Boho Wall Hanging', category: 'Decor', price: 949, image: 'wall_hanging_2.png', color: 'Beige', description: 'Bohemian style crochet wall art, crafted loop by loop.' },
  { name: 'Leaf Wall Hanging', category: 'Decor', price: 999, image: 'wall_hanging_3.png', color: 'Sage', description: 'Delicate leaf-motif wall hanging for a warm accent wall.' },
  { name: 'Crochet Flower - Blush', category: 'Decor', price: 249, image: 'flower_1.png', color: 'Blush Pink', description: 'Everlasting handmade crochet flower that never wilts.' },
  { name: 'Crochet Flower - Sunny', category: 'Decor', price: 249, image: 'flower_2.png', color: 'Yellow', description: 'Bright crochet bloom to brighten shelves and vases.' },
  { name: 'Crochet Flower - Rose', category: 'Decor', price: 269, image: 'flower_3.png', color: 'Rose', description: 'Soft rose crochet flower, perfect as a gift.' },
  { name: 'Crochet Idol - Small', category: 'Decor', price: 599, image: 'idol_1.png', color: 'Multicolor', description: 'Handmade crochet idol for festive and home decor.' },
  { name: 'Crochet Idol - Classic', category: 'Decor', price: 649, image: 'idol_2.png', color: 'Multicolor', description: 'Lovingly crafted crochet idol with fine detailing.' },
  { name: 'Crochet Idol - Deluxe', category: 'Decor', price: 699, image: 'idol_3.png', color: 'Multicolor', description: 'Detailed crochet idol, a graceful decor centerpiece.' },
  { name: 'Crochet Idol - Grand', category: 'Decor', price: 749, image: 'idol_4.png', color: 'Multicolor', description: 'Premium crochet idol handmade with love.' },
  { name: 'Crochet Dhol', category: 'Decor', price: 549, image: 'dhol.png', color: 'Brown', description: 'Miniature crochet dhol - a playful festive decoration.' },

  // ---------- Storage ----------
  { name: 'Crochet Basket - Small', category: 'Storage', price: 499, image: 'basket_1.png', color: 'Cream', description: 'Sturdy crochet basket for tidy, cozy storage.' },
  { name: 'Crochet Basket - Medium', category: 'Storage', price: 599, image: 'basket_2.png', color: 'Beige', description: 'Handmade basket perfect for organizing daily bits.' },
  { name: 'Crochet Basket - Large', category: 'Storage', price: 699, image: 'basket_3.png', color: 'Tan', description: 'Roomy crochet basket that keeps clutter away in style.' },
  { name: 'Crochet Basket - Round', category: 'Storage', price: 649, image: 'basket_4.png', color: 'Natural', description: 'Round woven basket, both useful and pretty.' },
  { name: 'Desk Organizer', category: 'Storage', price: 449, image: 'organiser_1.png', color: 'Cream', description: 'Keep your desk neat with this handmade organizer.' },
  { name: 'Multi Organizer', category: 'Storage', price: 479, image: 'organizer_2.png', color: 'Beige', description: 'Versatile crochet organizer for any corner.' },
  { name: 'Compact Organizer', category: 'Storage', price: 429, image: 'organizer_3.png', color: 'Ivory', description: 'Compact crochet organizer for small essentials.' },
  { name: 'Hanging Plant Holder', category: 'Storage', price: 399, image: 'plant_holder_1.png', color: 'Natural', description: 'Hanging crochet holder to show off your plants.' },
  { name: 'Plant Holder - Classic', category: 'Storage', price: 419, image: 'plant_holder_2.png', color: 'Cream', description: 'Classic macrame-style plant holder, handmade.' },
  { name: 'Plant Holder - Boho', category: 'Storage', price: 439, image: 'plant_holder_3.png', color: 'Beige', description: 'Boho crochet plant hanger for cozy green corners.' },
  { name: 'Plant Holder - Deluxe', category: 'Storage', price: 459, image: 'plant_holder_4.png', color: 'Tan', description: 'Deluxe plant holder crafted loop by loop.' },

  // ---------- Living ----------
  { name: 'Blue Geometric Cushion Cover', category: 'Living', price: 799, image: 'blue_geometric_cushion_cover.jpg', color: 'Blue', description: 'Geometric crochet cushion cover for a cozy sofa refresh.' },
  { name: 'Pastel Textured Cushion Cover', category: 'Living', price: 799, image: 'pastel_textured_cushion_cover.jpg', color: 'Pastel', description: 'Soft pastel textured cushion cover, handmade.' },
  { name: 'Sunflower Cushion Cover', category: 'Living', price: 849, image: 'sunflower_cushion_cover.jpg', color: 'Yellow', description: 'Cheerful sunflower crochet cushion cover.' },
  { name: 'Coaster Set - Ivory', category: 'Living', price: 199, image: 'coaster_1.png', color: 'Ivory', description: 'Handmade crochet coaster to protect your tables.' },
  { name: 'Coaster Set - Blush', category: 'Living', price: 199, image: 'coaster_2.png', color: 'Blush', description: 'Soft blush crochet coaster, sold as a cozy set.' },
  { name: 'Coaster Set - Sage', category: 'Living', price: 199, image: 'coaster_3.png', color: 'Sage', description: 'Sage crochet coaster to add a warm touch.' },
  { name: 'Coaster Set - Tan', category: 'Living', price: 219, image: 'coaster_4.png', color: 'Tan', description: 'Earthy tan crochet coaster for everyday use.' },
  { name: 'Coaster Set - Rose', category: 'Living', price: 219, image: 'coaster_5.png', color: 'Rose', description: 'Rose-toned crochet coaster, handmade with care.' },
  { name: 'Coaster Set - Mixed', category: 'Living', price: 239, image: 'coaster_6.png', color: 'Multicolor', description: 'Mixed color crochet coaster set for lively tables.' },

  // ---------- Wear & Carry ----------
  { name: 'Crochet Purse - Cream', category: 'Wear & Carry', price: 899, image: 'purse_1.png', color: 'Cream', description: 'Handmade crochet purse to carry your day in style.' },
  { name: 'Crochet Purse - Blush', category: 'Wear & Carry', price: 949, image: 'purse_2.png', color: 'Blush', description: 'Soft blush crochet purse, roomy and charming.' },
  { name: 'Crochet Purse - Tan', category: 'Wear & Carry', price: 999, image: 'purse_3.png', color: 'Tan', description: 'Earthy tan crochet purse, crafted loop by loop.' },
  { name: 'Crochet Purse - Boho', category: 'Wear & Carry', price: 1049, image: 'purse_4.png', color: 'Multicolor', description: 'Boho crochet purse that stands out beautifully.' },
  { name: 'Ivory Flower Hairband', category: 'Wear & Carry', price: 179, image: 'ivory_flower_hairband.jpg', color: 'Ivory', description: 'Dainty ivory flower crochet hairband.' },
  { name: 'Lavender Bow Hairband', category: 'Wear & Carry', price: 179, image: 'lavender_bow_hairband.jpg', color: 'Lavender', description: 'Sweet lavender bow hairband, handmade.' },
  { name: 'Pink Flower Hairband', category: 'Wear & Carry', price: 179, image: 'pink_flower_hairband.jpg', color: 'Pink', description: 'Pretty pink flower crochet hairband.' },
  { name: 'Sunflower Hairband', category: 'Wear & Carry', price: 189, image: 'sunflower_hairband.jpg', color: 'Yellow', description: 'Bright sunflower crochet hairband.' },
  { name: 'Crochet Keychain - Classic', category: 'Wear & Carry', price: 149, image: 'keychain_1.png', color: 'Multicolor', description: 'Cute crochet keychain, a lovely little gift.' },
  { name: 'Bee Crochet Keychain', category: 'Wear & Carry', price: 159, image: 'bee_crochet_keychain.jpg', color: 'Yellow', description: 'Adorable bee crochet keychain handmade with love.' },
  { name: 'Pink Heart Keychain', category: 'Wear & Carry', price: 159, image: 'pink_heart_crochet_keychain.jpg', color: 'Pink', description: 'Pink heart crochet keychain, perfect for gifting.' },
  { name: 'Rainbow Crochet Keychain', category: 'Wear & Carry', price: 169, image: 'rainbow_crochet_keychain.jpg', color: 'Multicolor', description: 'Colorful rainbow crochet keychain.' },
  { name: 'Sunflower Keychain', category: 'Wear & Carry', price: 159, image: 'sunflower_crochet_keychain.jpg', color: 'Yellow', description: 'Sunny sunflower crochet keychain.' },
  { name: 'Specs Pouch', category: 'Wear & Carry', price: 299, image: 'specs_pouch_1.png', color: 'Cream', description: 'Soft crochet pouch to keep your glasses safe.' },
];

async function run() {
  await connectDB(process.env.MONGODB_URI);

  const products = raw.map((p) => ({
    name: p.name,
    slug: slugify(p.name),
    category: p.category,
    price: p.price,
    description: p.description,
    color: p.color,
    material: 'Handmade crochet',
    stock: 15,
    imageUrl: `/products/${p.image}`,
  }));

  await Product.deleteMany({});
  await Product.insertMany(products);

  console.log(`Seeded ${products.length} products.`);
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
