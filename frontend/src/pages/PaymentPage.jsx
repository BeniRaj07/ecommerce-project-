import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { savePaymentMethod } from '../store/slices/cartSlice';

const PaymentPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const cart = useSelector((state) => state.cart);
  const { shippingAddress } = cart;

  useEffect(() => {
    if (!shippingAddress?.address) {
      navigate('/shipping');
    }
  }, [shippingAddress, navigate]);

  const [paymentMethod, setPaymentMethod] = useState('COD');

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(savePaymentMethod(paymentMethod));
    navigate('/placeorder');
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center items-center gap-2 mb-6">
          <img src="/images/icons/footwear.png" alt="Juttax" className="h-8 w-8" />
          <span className="text-2xl font-extrabold tracking-tight text-slate-900">Juttax</span>
        </Link>
        <h1 className="text-2xl font-bold mb-6 text-center text-slate-900">Payment Method</h1>
        <form onSubmit={submitHandler} className="bg-white shadow-soft rounded-2xl p-6">
          <label className="block text-slate-600 text-sm font-semibold mb-3">Select Method</label>
          <div className="space-y-2.5">
            <label className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${paymentMethod === 'eSewa' ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="eSewa"
                checked={paymentMethod === 'eSewa'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-slate-700">Pay with eSewa</span>
            </label>
            <label className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${paymentMethod === 'COD' ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="COD"
                checked={paymentMethod === 'COD'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-slate-700">Cash on Delivery (COD)</span>
            </label>
          </div>
          <button
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg mt-6 transition-colors"
            type="submit"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentPage;
