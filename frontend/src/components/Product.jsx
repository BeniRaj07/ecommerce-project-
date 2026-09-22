import React from 'react';
import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';

// Stable per-product pastel backdrop (same id always gets the same color)
// instead of a plain white shadowed card.
const PASTELS = ['bg-slate-100', 'bg-amber-50', 'bg-stone-200', 'bg-orange-50', 'bg-lime-50', 'bg-pink-50', 'bg-emerald-50', 'bg-rose-50'];
const pastelFor = (id) => {
  const sum = String(id).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PASTELS[sum % PASTELS.length];
};

const Product = ({ product }) => {
  return (
    <div className="group">
      <Link to={`/product/${product._id}`} className={`block relative overflow-hidden rounded-2xl ${pastelFor(product._id)}`}>
        <ProductImage
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-contain p-4 group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {product.isHandmade && (
            <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">Handmade</span>
          )}
          {product.madeInNepal && (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">Made in Nepal</span>
          )}
        </div>
      </Link>
      <div className="pt-3">
        <Link to={`/product/${product._id}`}>
          <h3 className="text-sm font-semibold text-slate-800 truncate group-hover:text-brand-600 transition-colors">{product.name}</h3>
        </Link>
        {product.maker?.name && (
          <p className="text-xs text-slate-400 mt-0.5">
            by {product.maker.name} · {product.maker.location}
          </p>
        )}
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-lg font-bold text-slate-900">Rs {product.price}/-</span>
          <span className="text-xs text-slate-400">{product.numReviews} reviews</span>
        </div>
        <Link
          to={`/product/${product._id}`}
          className="mt-3 block text-center border border-slate-200 hover:border-brand-500 hover:text-brand-600 text-slate-700 text-sm font-semibold py-2 rounded-full transition-colors"
        >
          Shop Now
        </Link>
      </div>
    </div>
  );
};

export default Product;
