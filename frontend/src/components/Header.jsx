import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import SearchBox from './SearchBox';
import { FaShoppingCart, FaUser, FaUserCircle, FaCaretDown } from 'react-icons/fa';

const Header = () => {
  const { cartItems } = useSelector((state) => state.cart);
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const logoutHandler = () => {
    dispatch(logout());
    navigate('/login');
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur text-slate-800 shadow-soft py-3 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center flex-shrink-0">
              <Link to="/" className="flex items-center gap-2">
                <img src="/images/icons/footwear.png" alt="Juttax" className="h-9 w-9" />
                <span className="text-xl font-extrabold tracking-tight text-slate-900">Juttax</span>
              </Link>
            </div>
            {!userInfo?.isAdmin && (
              <div className="flex-1 max-w-lg">
                <SearchBox />
              </div>
            )}
            <div className="flex items-center flex-shrink-0">
              <nav className="flex items-center">
                {userInfo ? (
                  <div className="relative ml-4">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center text-slate-600 hover:text-brand-600 transition-colors">
                      <FaUserCircle className="text-3xl" />
                      <FaCaretDown className="ml-1 text-xs" />
                    </button>
                    {isMenuOpen && (
                      <div className="absolute right-0 mt-3 w-52 bg-white rounded-xl shadow-card py-1.5 z-10 text-slate-700 border border-slate-100">
                        {!userInfo.isAdmin && (
                          <Link to="/orders" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-slate-50 rounded-lg mx-1.5">My Orders</Link>
                        )}
                        <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-slate-50 rounded-lg mx-1.5">Profile</Link>
                        <button onClick={logoutHandler} className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 rounded-lg mx-1.5">Logout</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link to="/login" className="ml-4 hidden sm:inline-flex items-center bg-brand-600 text-white font-semibold text-sm py-2 px-4 rounded-full hover:bg-brand-700 transition-colors">
                    <FaUser className="mr-2 text-xs" />
                    Sign In
                  </Link>
                )}
                {!userInfo?.isAdmin && (
                  <Link id="cart-icon" to="/cart" className="ml-5 relative text-slate-600 hover:text-brand-600 transition-colors">
                    <FaShoppingCart className="text-xl" />
                    {cartItems.length > 0 && (
                      <span className="absolute -top-2 -right-2.5 bg-brand-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {cartItems.reduce((acc, item) => acc + item.qty, 0)}
                      </span>
                    )}
                  </Link>
                )}
              </nav>
            </div>
          </div>
        </div>
      </header>
  );
};

export default Header;
