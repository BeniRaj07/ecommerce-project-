import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Products', to: '/admin/productlist' },
  { label: 'Orders', to: '/admin/orderlist' },
  { label: 'Users', to: '/admin/userlist' },
];

const AdminLayout = ({ title, actions, children }) => {
  const location = useLocation();

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          {actions}
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const active = location.pathname === tab.to;
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={`font-semibold py-2 px-4 rounded text-sm ${
                    active ? 'bg-gray-800 text-white' : 'bg-gray-200 hover:bg-gray-300 text-black'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
};

export default AdminLayout;
