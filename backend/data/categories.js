// Juttax footwear category tree.
export const footwearCategories = [
  {
    name: 'Men',
    subCategories: ['Formal Shoes', 'Casual Shoes', 'Sandals'],
  },
  {
    name: 'Women',
    subCategories: ['Flats', 'Sandals', 'Heels'],
  },
  {
    name: 'Kids',
    subCategories: ['School Shoes', 'Casual Shoes', 'Sandals'],
  },
  {
    name: 'Traditional / Local',
    subCategories: ['Handmade Shoes', 'Leather Shoes'],
  },
];

export const mainCategoryNames = footwearCategories.map((c) => c.name);

// Shop by Maker locations
export const makerLocations = ['Kathmandu', 'Lalitpur', 'Bhaktapur'];

export const stockTypes = ['Ready Stock', 'Made to Order'];
