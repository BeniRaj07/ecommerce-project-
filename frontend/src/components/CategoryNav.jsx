import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';
import { footwearCategories, topNav } from '../data/categories';

const CategoryNav = () => {
  const [isMegaOpen, setIsMegaOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-slate-100 relative">
      <div className="container mx-auto px-4">
        <div className="flex items-center">
          <div
            className="relative"
            onMouseEnter={() => setIsMegaOpen(true)}
            onMouseLeave={() => setIsMegaOpen(false)}
          >
            <button className="bg-slate-900 text-white text-sm font-semibold py-3 px-4 inline-flex items-center gap-2 hover:bg-slate-800 transition-colors">
              <FaBars />
              All Categories
            </button>

            {isMegaOpen && (
              <div className="absolute left-0 top-full z-20 bg-white shadow-card border border-slate-100 rounded-b-xl w-[720px] max-w-[90vw] grid grid-cols-4 gap-x-6 gap-y-5 p-6">
                {footwearCategories.map((cat) => (
                  <div key={cat.slug}>
                    <Link
                      to={`/category/${cat.slug}`}
                      className="block font-bold text-sm text-slate-900 hover:text-brand-600 mb-2 transition-colors"
                    >
                      {cat.name}
                    </Link>
                    <ul className="space-y-1.5">
                      {cat.subCategories.map((sub) => (
                        <li key={sub}>
                          <Link
                            to={`/category/${cat.slug}?sub=${encodeURIComponent(sub)}`}
                            className="text-sm text-slate-500 hover:text-brand-600 transition-colors"
                          >
                            {sub}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-7 ml-7 overflow-x-auto">
            {topNav.map((item) => (
              <Link key={item.label} to={item.to} className="text-sm text-slate-600 hover:text-brand-600 font-semibold whitespace-nowrap transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default CategoryNav;
