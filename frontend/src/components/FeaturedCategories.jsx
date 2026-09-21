import React from 'react';
import { Link } from 'react-router-dom';
import { FaMale, FaFemale, FaChild, FaStar, FaPaintBrush, FaCogs, FaBolt, FaGraduationCap } from 'react-icons/fa';
import { topNav } from '../data/categories';

const icons = {
  Men: FaMale,
  Women: FaFemale,
  Kids: FaChild,
  Traditional: FaStar,
  Handmade: FaPaintBrush,
  'Custom Made': FaCogs,
  Sports: FaBolt,
  School: FaGraduationCap,
};

const FeaturedCategories = () => {
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6 text-center">Shop by Category</h2>
        <div className="flex flex-wrap justify-center gap-8">
          {topNav.map((item) => {
            const Icon = icons[item.label];
            return (
              <Link to={item.to} key={item.label} className="flex flex-col items-center text-center group">
                <div className="w-24 h-24 p-4 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <Icon className="w-8 h-8 text-slate-700 group-hover:text-indigo-600" size={32} />
                </div>
                <span className="mt-2 font-semibold text-gray-700">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
