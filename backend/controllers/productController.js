import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc  --->  Fetch all products (supports keyword search + the full Juttax filter set)
// @route --->  GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  const {
    keyword,
    category, // mainCategory, exact name e.g. "Men"
    sub, // subCategory, exact name e.g. "Sneakers"
    minPrice,
    maxPrice,
    size,
    color,
    material,
    maker,
    location,
    handmade,
    madeInNepal,
    stockType,
    minRating,
  } = req.query;

  const filter = {};

  if (keyword) {
    filter.name = { $regex: escapeRegex(keyword), $options: 'i' };
  }

  if (category) {
    filter.mainCategory = { $regex: `^${escapeRegex(category)}$`, $options: 'i' };
  }

  if (sub) {
    filter.subCategory = { $regex: `^${escapeRegex(sub)}$`, $options: 'i' };
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (size) {
    const sizes = String(size)
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((s) => !Number.isNaN(s));
    if (sizes.length) filter.sizes = { $in: sizes };
  }

  if (color) {
    const colors = String(color)
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    if (colors.length) {
      filter.colors = { $in: colors.map((c) => new RegExp(`^${escapeRegex(c)}$`, 'i')) };
    }
  }

  if (material) {
    // substring match — many products list compound materials like "Leather & Rubber"
    filter.material = { $regex: escapeRegex(material), $options: 'i' };
  }

  if (maker) {
    filter['maker.name'] = { $regex: escapeRegex(maker), $options: 'i' };
  }

  if (location) {
    const locations = String(location).split(',').map((l) => l.trim()).filter(Boolean);
    if (locations.length) {
      filter['maker.location'] = { $in: locations.map((l) => new RegExp(`^${escapeRegex(l)}$`, 'i')) };
    }
  }

  if (handmade === 'true') {
    filter.isHandmade = true;
  }

  if (madeInNepal === 'true') {
    filter.madeInNepal = true;
  }

  if (stockType) {
    const types = String(stockType).split(',').map((s) => s.trim()).filter(Boolean);
    if (types.length) {
      filter.stockType = { $in: types.map((t) => new RegExp(`^${escapeRegex(t)}$`, 'i')) };
    }
  }

  if (minRating) {
    filter.rating = { $gte: Number(minRating) };
  }

  let query = Product.find(filter);

  switch (req.query.sort) {
    case 'newest':
      query = query.sort({ createdAt: -1 });
      break;
    case 'bestselling':
      query = query.sort({ numReviews: -1, rating: -1 });
      break;
    case 'price_asc':
      query = query.sort({ price: 1 });
      break;
    case 'price_desc':
      query = query.sort({ price: -1 });
      break;
    case 'rating':
      query = query.sort({ rating: -1 });
      break;
    default:
      break;
  }

  const products = await query;
  res.json(products);
};


// @desc --->   Fetch single product
// @route --->  GET /api/products/:id
// @access  Public

const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};

// @desc --->   Get top rated products
// @route --->  GET /api/products/top
// @access  Public
const getTopProducts = async (req, res) => {
  const products = await Product.find({}).sort({ rating: -1 }).limit(10);
  res.json(products);
};


// @desc --->  Create new review
// @route --->  POST /api/products/:id/reviews
// @access  Private
const createProductReview = async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400).json({ message: 'Product already reviewed' });
      return;
    }

    const deliveredOrder = await Order.findOne({
      user: req.user._id,
      isDelivered: true,
      'orderItems.product': product._id,
    });

    if (!deliveredOrder) {
      res.status(403).json({ message: 'You can only review a product after it has been delivered to you.' });
      return;
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review added' });
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};

// --- ADMIN FUNCTIONS ---

// @desc  --->  Create a product
// @route --->  POST /api/products
// @access --->  Private/Admin
const createProduct = async (req, res) => {
  const product = new Product({
    name: 'Sample Jutta',
    price: 0,
    user: req.user._id,
    image: '/images/icons/footwear.png',
    brand: 'Sample Brand',
    mainCategory: 'Men',
    subCategory: 'Casual Shoes',
    sizes: [40],
    colors: ['Black'],
    material: 'Synthetic',
    maker: { name: 'Sample Maker', location: 'Kathmandu' },
    isHandmade: false,
    madeInNepal: true,
    stockType: 'Ready Stock',
    countInStock: 0,
    numReviews: 0,
    description: 'Sample description',
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
};

// @desc  --->  Update a product
// @route --->  PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  const {
    name,
    price,
    description,
    image,
    brand,
    mainCategory,
    subCategory,
    countInStock,
    sizes,
    colors,
    material,
    maker,
    isHandmade,
    madeInNepal,
    stockType,
  } = req.body;
  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name;
    product.price = price;
    product.description = description;
    product.image = image;
    product.brand = brand;
    product.mainCategory = mainCategory;
    product.subCategory = subCategory;
    product.countInStock = countInStock;
    if (sizes !== undefined) product.sizes = sizes;
    if (colors !== undefined) product.colors = colors;
    if (material !== undefined) product.material = material;
    if (maker !== undefined) product.maker = maker;
    if (isHandmade !== undefined) product.isHandmade = isHandmade;
    if (madeInNepal !== undefined) product.madeInNepal = madeInNepal;
    if (stockType !== undefined) product.stockType = stockType;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};

// @desc  --->  Delete a product
// @route --->  DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    await Product.deleteOne({ _id: product._id });
    res.status(200).json({ message: 'Product removed' });
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};

export {
  getProducts,
  getProductById,
  createProductReview,
  createProduct,
  updateProduct,
  deleteProduct,
  getTopProducts,
};
