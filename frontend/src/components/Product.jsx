import React from 'react';
import { Link } from 'react-router-dom';

const Product = ({ product }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Link to={`/product/${product._id}`}>
        <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
      </Link>
      <div className="p-4">
        <div className="flex flex-wrap gap-1 mb-1">
          {product.isHandmade && (
            <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">Handmade</span>
          )}
          {product.madeInNepal && (
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">Made in Nepal</span>
          )}
        </div>
        <Link to={`/product/${product._id}`}>
          <h3 className="text-lg font-semibold truncate">{product.name}</h3>
        </Link>
        {product.maker?.name && (
          <p className="text-xs text-gray-500 mt-0.5">
            by {product.maker.name} · {product.maker.location}
          </p>
        )}
        <div className="my-2">
          <span>{product.numReviews} reviews</span>
        </div>

        <h3 className="text-2xl font-bold">Rs {product.price}/-</h3>
      </div>
    </div>
  );
};

export default Product;
