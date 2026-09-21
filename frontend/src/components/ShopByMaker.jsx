import React from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { makerLocations } from '../data/categories';

const ShopByMaker = () => {
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-2 text-center">Shop by Maker</h2>
        <p className="text-gray-500 text-center mb-6">Buy directly from footwear makers and sellers across Nepal</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {makerLocations.map((loc) => (
            <Link
              key={loc.slug}
              to={`/makers/${loc.slug}`}
              className="flex flex-col items-center justify-center text-center bg-white border rounded-lg py-6 px-2 hover:shadow-md hover:border-indigo-400 transition"
            >
              <FaMapMarkerAlt className="text-2xl text-indigo-600 mb-2" />
              <span className="font-semibold text-gray-700 text-sm">{loc.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopByMaker;
