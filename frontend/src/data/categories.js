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
    subCategories: ['Formal Shoes', 'Casual Shoes', 'Sneakers', 'Sandals', 'Slippers'],
  },
  {
    name: 'Women',
    subCategories: ['Flats', 'Sandals', 'Heels', 'Sneakers', 'Slippers'],
  },
  {
    name: 'Kids',
    subCategories: ['School Shoes', 'Casual Shoes', 'Sandals', 'Sports Shoes'],
  },
  {
    name: 'Traditional / Local',
    subCategories: ['Handmade Shoes', 'Leather Shoes', 'Traditional Jutta', 'Local Sandals'],
  },
  {
    name: 'Sports',
    subCategories: ['Running Shoes', 'Training Shoes', 'Football Shoes'],
  },
].map((c) => ({ ...c, slug: slugify(c.name) }));

// slug -> exact category name (used to translate a URL back into the value
// the API expects)
export const categoryBySlug = footwearCategories.reduce((acc, c) => {
  acc[c.slug] = c.name;
  return acc;
}, {});

// Homepage quick nav — one entry per main category, in tree order.
export const topNav = footwearCategories.map((c) => ({ label: c.name, to: `/category/${c.slug}` }));

// Shop by Maker
export const makerLocations = [
  { label: 'Kathmandu Makers', value: 'Kathmandu', slug: 'kathmandu' },
  { label: 'Lalitpur Makers', value: 'Lalitpur', slug: 'lalitpur' },
  { label: 'Bhaktapur Makers', value: 'Bhaktapur', slug: 'bhaktapur' },
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
export const kidsSizes = [28, 29, 30, 31, 32, 33];
export const adultSizes = [36, 37, 38, 39, 40, 41, 42, 43, 44];
export const filterSizes = [...kidsSizes, ...adultSizes];
export const filterColors = ['Black', 'Brown', 'Red', 'Maroon'];
export const filterMaterials = ['Leather', 'Canvas', 'Rubber', 'Synthetic'];
export const stockTypes = ['Ready Stock', 'Made to Order'];
