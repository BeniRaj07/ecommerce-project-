import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import TopBar from './components/TopBar';
import Header from './components/Header';
import Footer from './components/Footer';
import CategoryNav from './components/CategoryNav';

// Routes that render the customer storefront listing (HomePage) — admins
// are routed to /admin/dashboard instead of browsing these.
const STOREFRONT_PREFIXES = ['/search/', '/category/', '/makers/', '/collections/'];

const App = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const location = useLocation();

  const isStorefrontListing =
    location.pathname === '/' || STOREFRONT_PREFIXES.some((p) => location.pathname.startsWith(p));

  if (userInfo?.isAdmin && isStorefrontListing) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <Header />
      {!userInfo?.isAdmin && <CategoryNav />}
      <main className="flex-grow bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Outlet />
        </div>
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
};

export default App;
