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
  const [city, setCity] = useState(shippingAddress?.city || '');
  const [pincode, setPincode] = useState(shippingAddress?.pincode || '');
  const [state, setState] = useState(shippingAddress?.state || '');
  const [country, setCountry] = useState(shippingAddress?.country || 'Nepal');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(saveShippingAddress({ address, city, pincode, state, country }));
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
              placeholder="Enter address"
              value={address}
              required
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="city">City</label>
            <input
              className={inputClass}
              id="city"
              type="text"
              placeholder="Enter city"
              value={city}
              required
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="pincode">Pincode</label>
            <input
              className={inputClass}
              id="pincode"
              type="text"
              placeholder="Enter pincode"
              value={pincode}
              required
              onChange={(e) => setPincode(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="state">State</label>
            <input
              className={inputClass}
              id="state"
              type="text"
              placeholder="Enter state"
              value={state}
              required
              onChange={(e) => setState(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="country">Country</label>
            <input
              className={inputClass}
              id="country"
              type="text"
              placeholder="Enter country"
              value={country}
              required
              onChange={(e) => setCountry(e.target.value)}
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
