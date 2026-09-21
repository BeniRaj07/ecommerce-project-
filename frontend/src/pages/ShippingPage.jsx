import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { saveShippingAddress } from '../store/slices/cartSlice';

const inputClass = 'w-full border border-slate-200 rounded-lg py-2.5 px-3 outline-none focus:ring-2 focus:ring-brand-500';
const labelClass = 'block text-slate-600 text-sm font-semibold mb-1.5';

const ShippingPage = () => {
  const cart = useSelector((state) => state.cart);
  const { shippingAddress } = cart;

  const [address, setAddress] = useState(shippingAddress?.address || '');
  const [location, setLocation] = useState(shippingAddress?.location || '');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const submitHandler = (e) => {
    e.preventDefault();
    // Juttax currently only delivers within Kathmandu, Nepal
    dispatch(saveShippingAddress({ address, location, country: 'Nepal' }));
    navigate('/payment');
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-slate-900">Shipping</h1>
        <form onSubmit={submitHandler} className="bg-white shadow-soft rounded-2xl p-6 space-y-4">
          <div>
            <label className={labelClass} htmlFor="address">Address</label>
            <input
              className={inputClass}
              id="address"
              type="text"
              placeholder="House no. / building / street / area"
              value={address}
              required
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="location">Location</label>
            <input
              className={inputClass}
              id="location"
              type="text"
              placeholder="e.g. Baneshwor, Kathmandu"
              value={location}
              required
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <button
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
            type="submit"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShippingPage;
