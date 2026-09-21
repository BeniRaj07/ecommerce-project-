// Juttax category tree + filter vocab. Kept as the single source of truth
// so the nav, filter sidebar, admin forms and "Shop by Maker" section all
// agree on the same names/slugs.

export const slugify = (str) =>
  str
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/\//g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

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
].map((c) => ({ ...c, slug: slugify(c.name) }));

// slug -> exact category name (used to translate a URL back into the value
// the API expects)
export const categoryBySlug = footwearCategories.reduce((acc, c) => {
  acc[c.slug] = c.name;
  return acc;
}, {});

// The 8-item quick nav requested for the homepage. "Handmade" is a
// cross-category collection (isHandmade=true on any product), everything
// else points straight at a mainCategory.
export const topNav = [
  { label: 'Men', to: `/category/${categorySlugFor('Men')}` },
  { label: 'Women', to: `/category/${categorySlugFor('Women')}` },
  { label: 'Kids', to: `/category/${categorySlugFor('Kids')}` },
  { label: 'Traditional', to: `/category/${categorySlugFor('Traditional & Handmade')}` },
  { label: 'Handmade', to: '/collections/handmade' },
  { label: 'Custom Made', to: `/category/${categorySlugFor('Custom Made')}` },
  { label: 'Sports', to: `/category/${categorySlugFor('Sports & Outdoor')}` },
  { label: 'School', to: `/category/${categorySlugFor('School & Uniform')}` },
];

function categorySlugFor(name) {
  return slugify(name);
}

// Shop by Maker
export const makerLocations = [
  { label: 'Kathmandu Makers', value: 'Kathmandu', slug: 'kathmandu' },
  { label: 'Lalitpur Makers', value: 'Lalitpur', slug: 'lalitpur' },
  { label: 'Bhaktapur Makers', value: 'Bhaktapur', slug: 'bhaktapur' },
  { label: 'Pokhara Makers', value: 'Pokhara', slug: 'pokhara' },
  { label: 'Biratnagar Makers', value: 'Biratnagar', slug: 'biratnagar' },
  { label: 'Other Local Sellers', value: 'Other', slug: 'other' },
];

export const locationBySlug = makerLocations.reduce((acc, l) => {
  acc[l.slug] = l.value;
  return acc;
}, {});

// "Featured Local Collections" — curated views computed from product flags
// rather than a literal category.
export const collections = [
  { label: 'Made in Nepal', slug: 'made-in-nepal', params: { madeInNepal: 'true' } },
  { label: 'Handmade', slug: 'handmade', params: { handmade: 'true' } },
  { label: 'New Arrivals', slug: 'new-arrivals', params: { sort: 'newest' } },
  { label: 'Best Selling', slug: 'best-selling', params: { sort: 'bestselling' } },
  { label: 'Budget Collection', slug: 'budget-collection', params: { maxPrice: '2000' } },
  { label: 'Premium Collection', slug: 'premium-collection', params: { minPrice: '5000' } },
];

export const collectionBySlug = collections.reduce((acc, c) => {
  acc[c.slug] = c;
  return acc;
}, {});

// Filter vocab shared by the FilterSidebar
export const filterSizes = [28, 29, 30, 31, 32, 33, 36, 37, 38, 39, 40, 41, 42, 43, 44];
export const filterColors = [
  'Black', 'Brown', 'White', 'Grey', 'Tan', 'Red', 'Blue', 'Pink', 'Maroon', 'Gold', 'Green', 'Navy',
];
export const filterMaterials = ['Leather', 'Genuine Leather', 'Suede', 'Canvas', 'Synthetic', 'Rubber', 'Mesh', 'EVA'];
export const stockTypes = ['Ready Stock', 'Made to Order'];
