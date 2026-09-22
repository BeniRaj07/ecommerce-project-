import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaTachometerAlt, FaBoxOpen, FaClipboardList, FaUsers, FaUserCircle } from 'react-icons/fa';

const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: FaTachometerAlt },
  { label: 'Products', to: '/admin/productlist', icon: FaBoxOpen },
  { label: 'Orders', to: '/admin/orderlist', icon: FaClipboardList },
  { label: 'Users', to: '/admin/userlist', icon: FaUsers },
];

const AdminLayout = ({ title, actions, children }) => {
  const location = useLocation();
  const { userInfo } = useSelector((state) => state.auth);

  return (
    <div className="flex flex-1 w-full">
      <aside className="hidden md:flex md:w-60 flex-shrink-0 flex-col bg-slate-900 text-slate-300">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-800">
          <img src="/images/icons/footwear.png" alt="Juttax" className="h-8 w-8 rounded" />
          <span className="text-white font-extrabold tracking-tight">Juttax Admin</span>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="text-base" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-slate-800 flex items-center gap-2 text-sm text-slate-400">
          <FaUserCircle className="text-xl" />
          <span className="truncate">{userInfo?.name}</span>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="px-4 sm:px-8 py-6 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
            <h1 className="font-display text-2xl font-bold text-slate-900">{title}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              {actions}
              <nav className="flex md:hidden gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`text-xs font-semibold py-2 px-3 rounded-lg ${
                      location.pathname === item.to ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
