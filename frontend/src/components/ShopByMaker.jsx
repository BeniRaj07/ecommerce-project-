import React from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { makerLocations } from '../data/categories';

const ShopByMaker = () => {
  return (
    <section className="py-14 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-9">
          <h2 className="font-display text-3xl font-bold text-slate-900">Shop by Maker</h2>
          <p className="text-slate-500 text-sm mt-1">Buy directly from footwear makers and sellers across Nepal</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
          {makerLocations.map((loc) => (
            <Link
              key={loc.slug}
              to={`/makers/${loc.slug}`}
              className="flex flex-col items-center justify-center text-center bg-white rounded-2xl py-8 px-4 shadow-soft hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
            >
              <span className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-3">
                <FaMapMarkerAlt className="text-brand-600 text-lg" />
              </span>
              <span className="font-semibold text-slate-800 text-sm">{loc.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopByMaker;
