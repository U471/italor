'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const Fabric = require('../src/models/Fabric');

const FABRICS = [
  { name: 'Italian Merino Wool', description: 'Premium Italian merino wool, soft and breathable', material: 'wool', color: 'navy', pattern: 'solid', price: 320, origin: 'Italy', weight: 280, tags: ['premium', 'italian', 'merino'] },
  { name: 'British Herringbone Wool', description: 'Classic British herringbone tweed, perfect for suits', material: 'wool', color: 'charcoal', pattern: 'herringbone', price: 280, origin: 'UK', weight: 310, tags: ['classic', 'tweed'] },
  { name: 'Egyptian Cotton Oxford', description: 'Crisp Egyptian cotton with a fine oxford weave', material: 'cotton', color: 'white', pattern: 'solid', price: 120, origin: 'Egypt', weight: 150, tags: ['cotton', 'lightweight'] },
  { name: 'Linen Summer Blend', description: 'Cool and breathable linen for warm weather', material: 'linen', color: 'beige', pattern: 'solid', price: 160, origin: 'Belgium', weight: 200, tags: ['summer', 'breathable'] },
  { name: 'Cashmere Pinstripe', description: 'Luxurious cashmere with fine pinstripe', material: 'cashmere', color: 'grey', pattern: 'pinstripe', price: 580, origin: 'Scotland', weight: 260, tags: ['luxury', 'cashmere'] },
  { name: 'Wool Plaid Classic', description: 'Traditional plaid pattern in pure wool', material: 'wool', color: 'brown', pattern: 'plaid', price: 240, origin: 'Scotland', weight: 300, tags: ['classic', 'plaid'] },
  { name: 'Silk Charmeuse', description: 'Lightweight silk with a smooth finish', material: 'silk', color: 'ivory', pattern: 'solid', price: 420, origin: 'China', weight: 90, tags: ['silk', 'luxury', 'smooth'] },
  { name: 'Navy Chalk Stripe Wool', description: 'Classic chalk stripe on navy ground', material: 'wool', color: 'navy', pattern: 'striped', price: 290, origin: 'Italy', weight: 270, tags: ['business', 'classic'] },
  { name: 'Houndstooth Wool', description: 'Bold houndstooth check in black and white', material: 'wool', color: 'black', pattern: 'houndstooth', price: 260, origin: 'UK', weight: 290, tags: ['bold', 'classic'] },
  { name: 'Checked Cotton Flannel', description: 'Warm and soft flannel cotton with check pattern', material: 'cotton', color: 'blue', pattern: 'checked', price: 140, origin: 'Portugal', weight: 220, tags: ['casual', 'flannel'] },
  { name: 'Charcoal Worsted Wool', description: 'Fine worsted wool in charcoal grey, smooth finish', material: 'wool', color: 'charcoal', pattern: 'solid', price: 310, origin: 'Italy', weight: 260, tags: ['business', 'worsted'] },
  { name: 'Light Grey Flannel', description: 'Soft flannel wool in medium grey', material: 'wool', color: 'grey', pattern: 'solid', price: 270, origin: 'UK', weight: 320, tags: ['flannel', 'soft'] },
  { name: 'Tropical Wool', description: 'Lightweight wool ideal for warm climates', material: 'wool', color: 'tan', pattern: 'solid', price: 230, origin: 'Italy', weight: 200, tags: ['summer', 'lightweight'] },
  { name: 'Burgundy Velvet', description: 'Rich velvet fabric for formal occasions', material: 'cotton', color: 'burgundy', pattern: 'solid', price: 380, origin: 'France', weight: 400, tags: ['formal', 'velvet', 'luxury'] },
  { name: 'Black Tuxedo Wool', description: 'Smooth black wool for evening wear', material: 'wool', color: 'black', pattern: 'solid', price: 350, origin: 'Italy', weight: 250, tags: ['formal', 'tuxedo'] },
  { name: 'Tan Linen Cotton Blend', description: 'Comfortable linen-cotton blend for casual suits', material: 'blend', color: 'tan', pattern: 'solid', price: 180, origin: 'Spain', weight: 210, tags: ['casual', 'summer'] },
  { name: 'Royal Blue Wool', description: 'Vibrant royal blue in fine wool', material: 'wool', color: 'blue', pattern: 'solid', price: 300, origin: 'Italy', weight: 270, tags: ['vibrant', 'premium'] },
  { name: 'Olive Tweed', description: 'Country-style olive tweed with flecked texture', material: 'wool', color: 'green', pattern: 'checked', price: 250, origin: 'Ireland', weight: 350, tags: ['country', 'tweed', 'casual'] },
  { name: 'Cream Linen', description: 'Pure linen in natural cream, elegant and cool', material: 'linen', color: 'ivory', pattern: 'solid', price: 170, origin: 'Ireland', weight: 190, tags: ['summer', 'natural'] },
  { name: 'Grey Glen Plaid', description: 'Classic glen plaid in medium grey', material: 'wool', color: 'grey', pattern: 'plaid', price: 285, origin: 'Scotland', weight: 290, tags: ['classic', 'glen plaid'] },
  { name: 'Midnight Blue Cashmere', description: 'Ultra-soft cashmere in deep midnight blue', material: 'cashmere', color: 'navy', pattern: 'solid', price: 620, origin: 'Mongolia', weight: 240, tags: ['luxury', 'cashmere', 'premium'] },
  { name: 'Tan Windowpane', description: 'Elegant windowpane check on tan ground', material: 'wool', color: 'tan', pattern: 'checked', price: 265, origin: 'Italy', weight: 275, tags: ['business', 'check'] },
  { name: 'Pink Cotton Oxford', description: 'Classic pink cotton oxford, perfect for summer', material: 'cotton', color: 'pink', pattern: 'solid', price: 110, origin: 'Egypt', weight: 145, tags: ['summer', 'casual'] },
  { name: 'Grey Polyester Blend', description: 'Durable polyester blend for everyday wear', material: 'polyester', color: 'grey', pattern: 'solid', price: 90, origin: 'China', weight: 230, tags: ['durable', 'affordable'] },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  process.stdout.write('Connected to MongoDB\n');

  await Fabric.deleteMany({});
  process.stdout.write('Cleared existing fabrics\n');

  await Fabric.insertMany(FABRICS);
  process.stdout.write(`Seeded ${FABRICS.length} fabrics\n`);

  await mongoose.disconnect();
  process.stdout.write('Done\n');
}

seed().catch((err) => {
  process.stdout.write(`Seed failed: ${err.message}\n`);
  process.exit(1);
});
