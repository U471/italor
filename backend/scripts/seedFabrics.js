'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const Fabric = require('../src/models/Fabric');

const CARE_WOOL = 'Dry clean only. Do not bleach. Store folded in a cool, dry place.';
const CARE_COTTON = 'Machine wash cold. Tumble dry low. Iron on medium heat.';
const CARE_LINEN = 'Hand wash or dry clean. Iron while damp. Avoid direct sunlight.';
const CARE_SILK = 'Dry clean only. Handle with care. Avoid water spotting.';
const CARE_CASHMERE = 'Hand wash in cold water with mild detergent. Dry flat. Do not wring.';
const CARE_BLEND = 'Dry clean recommended. Iron on low heat with pressing cloth.';

const FABRICS = [
  { name: 'Italian Merino Wool', description: 'Premium Italian merino wool, soft and breathable', material: 'wool', color: 'navy', pattern: 'solid', price: 320, origin: 'Italy', weight: 280, tags: ['premium', 'italian', 'merino'], season: 'all-year', careInstructions: CARE_WOOL, patternDescription: 'Clean, unbroken solid navy — the most versatile base for any tailored suit.' },
  { name: 'British Herringbone Wool', description: 'Classic British herringbone tweed, perfect for suits', material: 'wool', color: 'charcoal', pattern: 'herringbone', price: 280, origin: 'UK', weight: 310, tags: ['classic', 'tweed'], season: 'winter', careInstructions: CARE_WOOL, patternDescription: 'Traditional V-shaped weave creating a subtle texture, characteristic of British tailoring.' },
  { name: 'Egyptian Cotton Oxford', description: 'Crisp Egyptian cotton with a fine oxford weave', material: 'cotton', color: 'white', pattern: 'solid', price: 120, origin: 'Egypt', weight: 150, tags: ['cotton', 'lightweight'], season: 'summer', careInstructions: CARE_COTTON, patternDescription: 'Smooth, even solid weave in crisp white — ideal for summer suits and formal wear.' },
  { name: 'Linen Summer Blend', description: 'Cool and breathable linen for warm weather', material: 'linen', color: 'beige', pattern: 'solid', price: 160, origin: 'Belgium', weight: 200, tags: ['summer', 'breathable'], season: 'summer', careInstructions: CARE_LINEN, patternDescription: 'Natural linen texture in warm beige, perfect for destination weddings and warm climates.' },
  { name: 'Cashmere Pinstripe', description: 'Luxurious cashmere with fine pinstripe', material: 'cashmere', color: 'grey', pattern: 'pinstripe', price: 580, origin: 'Scotland', weight: 260, tags: ['luxury', 'cashmere'], season: 'winter', careInstructions: CARE_CASHMERE, patternDescription: 'Hair-thin chalk lines on grey ground — a power-dressing classic from the City.' },
  { name: 'Wool Plaid Classic', description: 'Traditional plaid pattern in pure wool', material: 'wool', color: 'brown', pattern: 'plaid', price: 240, origin: 'Scotland', weight: 300, tags: ['classic', 'plaid'], season: 'winter', careInstructions: CARE_WOOL, patternDescription: 'Intersecting horizontal and vertical stripes forming a classic tartan-inspired check.' },
  { name: 'Silk Charmeuse', description: 'Lightweight silk with a smooth finish', material: 'silk', color: 'ivory', pattern: 'solid', price: 420, origin: 'China', weight: 90, tags: ['silk', 'luxury', 'smooth'], season: 'summer', careInstructions: CARE_SILK, patternDescription: 'Pure solid ivory with a characteristic satin-like drape and lustrous sheen.' },
  { name: 'Navy Chalk Stripe Wool', description: 'Classic chalk stripe on navy ground', material: 'wool', color: 'navy', pattern: 'striped', price: 290, origin: 'Italy', weight: 270, tags: ['business', 'classic'], season: 'all-year', careInstructions: CARE_WOOL, patternDescription: 'Soft chalk-white stripes on deep navy, a staple of city banking and boardroom attire.' },
  { name: 'Houndstooth Wool', description: 'Bold houndstooth check in black and white', material: 'wool', color: 'black', pattern: 'houndstooth', price: 260, origin: 'UK', weight: 290, tags: ['bold', 'classic'], season: 'all-year', careInstructions: CARE_WOOL, patternDescription: 'Broken checks forming a distinctive four-pointed star, a timeless fashion-forward print.' },
  { name: 'Checked Cotton Flannel', description: 'Warm and soft flannel cotton with check pattern', material: 'cotton', color: 'blue', pattern: 'checked', price: 140, origin: 'Portugal', weight: 220, tags: ['casual', 'flannel'], season: 'winter', careInstructions: CARE_COTTON, patternDescription: 'Evenly spaced window-pane checks with a soft, napped flannel texture.' },
  { name: 'Charcoal Worsted Wool', description: 'Fine worsted wool in charcoal grey, smooth finish', material: 'wool', color: 'charcoal', pattern: 'solid', price: 310, origin: 'Italy', weight: 260, tags: ['business', 'worsted'], season: 'all-year', careInstructions: CARE_WOOL, patternDescription: 'Perfectly smooth solid charcoal — the universal suit fabric for all professional occasions.' },
  { name: 'Light Grey Flannel', description: 'Soft flannel wool in medium grey', material: 'wool', color: 'grey', pattern: 'solid', price: 270, origin: 'UK', weight: 320, tags: ['flannel', 'soft'], season: 'winter', careInstructions: CARE_WOOL, patternDescription: 'Medium grey with a subtle nap, giving depth and warmth compared to smooth weaves.' },
  { name: 'Tropical Wool', description: 'Lightweight wool ideal for warm climates', material: 'wool', color: 'tan', pattern: 'solid', price: 230, origin: 'Italy', weight: 200, tags: ['summer', 'lightweight'], season: 'summer', careInstructions: CARE_WOOL, patternDescription: 'Open-weave solid tan — engineered for breathability in hot and humid climates.' },
  { name: 'Burgundy Velvet', description: 'Rich velvet fabric for formal occasions', material: 'cotton', color: 'burgundy', pattern: 'solid', price: 380, origin: 'France', weight: 400, tags: ['formal', 'velvet', 'luxury'], season: 'winter', careInstructions: CARE_COTTON, patternDescription: 'Deep burgundy with a cut-pile surface that absorbs light for a dramatic, luxurious appearance.' },
  { name: 'Black Tuxedo Wool', description: 'Smooth black wool for evening wear', material: 'wool', color: 'black', pattern: 'solid', price: 350, origin: 'Italy', weight: 250, tags: ['formal', 'tuxedo'], season: 'all-year', careInstructions: CARE_WOOL, patternDescription: 'Jet black with a smooth high-twist weave — the definitive fabric for black-tie events.' },
  { name: 'Tan Linen Cotton Blend', description: 'Comfortable linen-cotton blend for casual suits', material: 'blend', color: 'tan', pattern: 'solid', price: 180, origin: 'Spain', weight: 210, tags: ['casual', 'summer'], season: 'summer', careInstructions: CARE_BLEND, patternDescription: 'Natural tan with slight linen texture — relaxed yet refined for smart-casual styling.' },
  { name: 'Royal Blue Wool', description: 'Vibrant royal blue in fine wool', material: 'wool', color: 'blue', pattern: 'solid', price: 300, origin: 'Italy', weight: 270, tags: ['vibrant', 'premium'], season: 'all-year', careInstructions: CARE_WOOL, patternDescription: 'A confident, saturated royal blue in a smooth twill weave — for those who stand out.' },
  { name: 'Olive Tweed', description: 'Country-style olive tweed with flecked texture', material: 'wool', color: 'green', pattern: 'checked', price: 250, origin: 'Ireland', weight: 350, tags: ['country', 'tweed', 'casual'], season: 'winter', careInstructions: CARE_WOOL, patternDescription: 'Multi-tone olive flecks woven into an open check — classic country house and shooting estate style.' },
  { name: 'Cream Linen', description: 'Pure linen in natural cream, elegant and cool', material: 'linen', color: 'ivory', pattern: 'solid', price: 170, origin: 'Ireland', weight: 190, tags: ['summer', 'natural'], season: 'summer', careInstructions: CARE_LINEN, patternDescription: 'Off-white natural linen — slightly textured and effortlessly elegant in warm weather.' },
  { name: 'Grey Glen Plaid', description: 'Classic glen plaid in medium grey', material: 'wool', color: 'grey', pattern: 'plaid', price: 285, origin: 'Scotland', weight: 290, tags: ['classic', 'glen plaid'], season: 'all-year', careInstructions: CARE_WOOL, patternDescription: 'Intersecting houndstooth and over-check pattern — a sophisticated alternative to plain solid.' },
  { name: 'Midnight Blue Cashmere', description: 'Ultra-soft cashmere in deep midnight blue', material: 'cashmere', color: 'navy', pattern: 'solid', price: 620, origin: 'Mongolia', weight: 240, tags: ['luxury', 'cashmere', 'premium'], season: 'winter', careInstructions: CARE_CASHMERE, patternDescription: 'The deepest navy in the finest cashmere — an extraordinary fabric for extraordinary occasions.' },
  { name: 'Tan Windowpane', description: 'Elegant windowpane check on tan ground', material: 'wool', color: 'tan', pattern: 'checked', price: 265, origin: 'Italy', weight: 275, tags: ['business', 'check'], season: 'all-year', careInstructions: CARE_WOOL, patternDescription: 'Thin grid lines forming large open squares on a tan ground — the epitome of understated elegance.' },
  { name: 'Pink Cotton Oxford', description: 'Classic pink cotton oxford, perfect for summer', material: 'cotton', color: 'pink', pattern: 'solid', price: 110, origin: 'Egypt', weight: 145, tags: ['summer', 'casual'], season: 'summer', careInstructions: CARE_COTTON, patternDescription: 'Soft blush-pink in a basket weave — bringing personality to warm-weather tailoring.' },
  { name: 'Grey Polyester Blend', description: 'Durable polyester blend for everyday wear', material: 'polyester', color: 'grey', pattern: 'solid', price: 90, origin: 'China', weight: 230, tags: ['durable', 'affordable'], season: 'all-year', careInstructions: CARE_BLEND, patternDescription: 'Clean solid grey with wrinkle-resistant properties — practical and low-maintenance.' },
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
