import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';
import { footwearCategories, topNav } from '../data/categories';

const CategoryNav = () => {
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const location = useLocation();

  // "All Categories" reads as active whenever the URL isn't one of the
  // specific category routes below — i.e. the unfiltered browsing page,
  // search results, or a maker page — derived from the route so it
  // survives a refresh instead of living in component state.
  const isAnyCategoryActive = topNav.some((item) => location.pathname === item.to);

  return (
    <nav className="bg-white border-b border-slate-100 relative">
      <div className="container mx-auto px-4">
        <div className="flex items-center">
          <div
            className="relative"
            onMouseEnter={() => setIsMegaOpen(true)}
            onMouseLeave={() => setIsMegaOpen(false)}
          >
            <button
              className={`text-sm font-semibold py-3 px-4 inline-flex items-center gap-2 transition-colors border-b-2 ${
                isAnyCategoryActive
                  ? 'bg-slate-900 text-white border-transparent hover:bg-slate-800'
                  : 'bg-slate-900 text-white border-brand-500 hover:bg-slate-800'
              }`}
            >
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
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm font-semibold whitespace-nowrap transition-colors py-3 border-b-2 ${
                    isActive
                      ? 'text-brand-600 border-brand-500'
                      : 'text-slate-600 border-transparent hover:text-brand-600'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default CategoryNav;
