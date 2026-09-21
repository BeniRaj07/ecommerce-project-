// Juttax footwear category tree.
// "Featured Local Collections" is intentionally not a mainCategory here —
// those are smart/curated views computed from product flags
// (madeInNepal, isHandmade, createdAt, rating, price), not a literal category.
export const footwearCategories = [
  {
    name: 'Men',
    subCategories: [
      'Formal Shoes',
      'Casual Shoes',
      'Leather Shoes',
      'Loafers',
      'Sneakers',
      'Sandals',
      'Slippers / Chappal',
      'Boots',
    ],
  },
  {
    name: 'Women',
    subCategories: [
      'Flats / Bellies',
      'Sandals',
      'Heels',
      'Casual Shoes',
      'Sneakers',
      'Slippers / Chappal',
      'Boots',
    ],
  },
  {
    name: 'Kids',
    subCategories: ['School Shoes', 'Casual Shoes', 'Sandals', 'Sports Shoes', 'Slippers'],
  },
  {
    name: 'Traditional & Handmade',
    subCategories: [
      'Nepali Handmade Shoes',
      'Leather Jutta',
      'Traditional Jutta',
      'Handmade Sandals',
      'Handmade Slippers',
      'Cultural / Ethnic Footwear',
    ],
  },
  {
    name: 'Custom Made',
    subCategories: [
      'Made-to-Order Shoes',
      'Custom Size',
      'Custom Color',
      'Custom Design',
      'Personalized Footwear',
    ],
  },
  {
    name: 'Local Leather Collection',
    subCategories: [
      'Genuine Leather Shoes',
      'Leather Sandals',
      'Leather Slippers',
      'Leather Boots',
      'Leather Formal Shoes',
    ],
  },
  {
    name: 'Sports & Outdoor',
    subCategories: ['Running Shoes', 'Training Shoes', 'Football Shoes', 'Hiking Shoes', 'Trekking Shoes'],
  },
  {
    name: 'School & Uniform',
    subCategories: ['Black School Shoes', 'White School Shoes', 'PT Shoes', 'College Shoes'],
  },
  {
    name: 'Work & Utility',
    subCategories: ['Work Shoes', 'Safety Shoes', 'Rain Boots', 'Durable Everyday Shoes'],
  },
];

export const mainCategoryNames = footwearCategories.map((c) => c.name);

// Shop by Maker locations
export const makerLocations = [
  'Kathmandu',
  'Lalitpur',
  'Bhaktapur',
  'Pokhara',
  'Biratnagar',
  'Other',
];

export const stockTypes = ['Ready Stock', 'Made to Order'];
