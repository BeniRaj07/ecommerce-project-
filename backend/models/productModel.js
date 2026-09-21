import mongoose from 'mongoose';
import { mainCategoryNames, makerLocations, stockTypes } from '../data/categories.js';

// THIS NEW SCHEMA IS FOR REVIEWS
const reviewSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const productSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: { type: String, required: true },
    image: { type: String, required: true },
    brand: { type: String, required: true },
    description: { type: String, required: true },

    // Category tree (Footwear is the only vertical Juttax sells)
    mainCategory: { type: String, required: true, enum: mainCategoryNames },
    subCategory: { type: String, required: true },

    // Product attributes used for filtering
    sizes: [{ type: Number }],
    colors: [{ type: String }],
    material: { type: String, required: true },

    // The local seller / workshop fulfilling this listing
    maker: {
      name: { type: String, required: true },
      location: { type: String, required: true, enum: makerLocations },
    },
    isHandmade: { type: Boolean, required: true, default: false },
    madeInNepal: { type: Boolean, required: true, default: true },
    stockType: { type: String, required: true, enum: stockTypes, default: 'Ready Stock' },

    reviews: [reviewSchema],
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    countInStock: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

export default Product;
