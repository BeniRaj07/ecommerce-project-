import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';
import { footwearCategories, topNav, collections } from '../data/categories';

const CategoryNav = () => {
  const [isMegaOpen, setIsMegaOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-t border-b relative">
      <div className="container mx-auto px-4">
        <div className="flex items-center">
          <div
            className="relative"
            onMouseEnter={() => setIsMegaOpen(true)}
            onMouseLeave={() => setIsMegaOpen(false)}
          >
            <button className="bg-slate-800 text-white font-bold py-3 px-4 inline-flex items-center">
              <FaBars className="mr-2" />
              All Categories
            </button>

            {isMegaOpen && (
              <div className="absolute left-0 top-full z-20 bg-white shadow-xl border rounded-b-md w-[720px] max-w-[90vw] grid grid-cols-3 gap-x-6 gap-y-4 p-6">
                {footwearCategories.map((cat) => (
                  <div key={cat.slug}>
                    <Link
                      to={`/category/${cat.slug}`}
                      className="block font-bold text-slate-800 hover:text-indigo-600 mb-2"
                    >
                      {cat.name}
                    </Link>
                    <ul className="space-y-1">
                      {cat.subCategories.map((sub) => (
                        <li key={sub}>
                          <Link
                            to={`/category/${cat.slug}?sub=${encodeURIComponent(sub)}`}
                            className="text-sm text-gray-600 hover:text-indigo-600"
                          >
                            {sub}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div>
                  <span className="block font-bold text-slate-800 mb-2">Featured Local Collections</span>
                  <ul className="space-y-1">
                    {collections.map((c) => (
                      <li key={c.slug}>
                        <Link to={`/collections/${c.slug}`} className="text-sm text-gray-600 hover:text-indigo-600">
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-6 ml-6 overflow-x-auto">
            {topNav.map((item) => (
              <Link key={item.label} to={item.to} className="text-gray-600 hover:text-indigo-600 font-semibold whitespace-nowrap">
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
