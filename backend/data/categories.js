// Juttax footwear category tree.
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
];

export const mainCategoryNames = footwearCategories.map((c) => c.name);

// Shop by Maker locations
export const makerLocations = ['Kathmandu', 'Lalitpur', 'Bhaktapur'];

export const stockTypes = ['Ready Stock', 'Made to Order'];
