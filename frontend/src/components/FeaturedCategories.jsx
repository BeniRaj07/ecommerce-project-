import React from 'react';
import { Link } from 'react-router-dom';
import { FaMale, FaFemale, FaChild, FaPaintBrush, FaBolt } from 'react-icons/fa';
import { topNav } from '../data/categories';

const icons = {
  Men: FaMale,
  Women: FaFemale,
  Kids: FaChild,
  'Traditional / Local': FaPaintBrush,
  Sports: FaBolt,
};

const FeaturedCategories = () => {
  return (
    <section className="py-14 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-9">
          <h2 className="text-2xl font-bold text-slate-900">Shop by Category</h2>
          <p className="text-slate-500 text-sm mt-1">Find footwear for everyone, from everyday wear to festive traditions</p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
          {topNav.map((item) => {
            const Icon = icons[item.label];
            return (
              <Link
                to={item.to}
                key={item.label}
                className="flex flex-col items-center text-center group bg-white border border-slate-100 rounded-2xl px-6 py-6 w-32 shadow-soft hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center group-hover:bg-brand-600 transition-colors">
                  <Icon className="text-brand-600 group-hover:text-white transition-colors" size={22} />
                </div>
                <span className="mt-3 text-sm font-semibold text-slate-700">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
