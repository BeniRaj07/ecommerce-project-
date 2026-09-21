import React from 'react';
import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';

const Product = ({ product }) => {
  return (
    <div className="bg-white rounded-2xl shadow-soft hover:shadow-card-hover overflow-hidden transition-all hover:-translate-y-0.5 group">
      <Link to={`/product/${product._id}`} className="block relative overflow-hidden">
        <ProductImage
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
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
      <div className="p-4">
        <Link to={`/product/${product._id}`}>
          <h3 className="text-sm font-semibold text-slate-800 truncate group-hover:text-brand-600 transition-colors">{product.name}</h3>
        </Link>
        {product.maker?.name && (
          <p className="text-xs text-slate-400 mt-0.5">
            by {product.maker.name} · {product.maker.location}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-slate-900">Rs {product.price}/-</span>
          <span className="text-xs text-slate-400">{product.numReviews} reviews</span>
        </div>
      </div>
    </div>
  );
};

export default Product;
