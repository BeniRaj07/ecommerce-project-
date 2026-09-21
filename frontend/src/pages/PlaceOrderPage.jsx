import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearCartItems } from '../store/slices/cartSlice';
import API from '../api';
import { toast } from 'react-toastify';

const PlaceOrderPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);

  useEffect(() => {
    if (!cart.shippingAddress.address) {
      navigate('/shipping');
    } else if (!cart.paymentMethod) {
      navigate('/payment');
    }
  }, [cart.paymentMethod, cart.shippingAddress.address, navigate]);

  const itemsPrice = cart.cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);
  const taxPrice = itemsPrice * 0.18;
  const shippingPrice = 0;
  const totalPrice = itemsPrice + taxPrice + shippingPrice;

  const placeOrderHandler = async () => {
    try {

      const res = await API.post('/api/orders', {
        orderItems: cart.cartItems,
        shippingAddress: cart.shippingAddress,
        paymentMethod: cart.paymentMethod,
        itemsPrice: itemsPrice.toFixed(2),
        taxPrice: taxPrice.toFixed(2),
        shippingPrice: shippingPrice.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
      });

      // COD has no separate payment step, so the order being created IS the
      // successful-checkout moment. Online methods (eSewa/Stripe) only clear
      // the cart once OrderPage confirms the payment actually succeeded.
      if (cart.paymentMethod === 'COD') {
        dispatch(clearCartItems());
      }
      navigate(`/order/${res.data._id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl shadow-soft p-5">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Shipping</h2>
          <p className="text-sm text-slate-600">
            {cart.shippingAddress.address}, {cart.shippingAddress.location}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-5">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Payment Method</h2>
          <p className="text-sm text-slate-600">{cart.paymentMethod}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-5">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Order Items</h2>
          {cart.cartItems.length === 0 ? (
            <p className="text-sm text-slate-500">Your cart is empty</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {cart.cartItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                    <Link to={`/product/${item._id}`} className="text-sm font-medium text-slate-800 hover:text-brand-600 truncate">{item.name}</Link>
                  </div>
                  <div className="text-sm text-slate-600 whitespace-nowrap">
                    {item.qty} x Rs {item.price}/- = <b className="text-slate-900">Rs {item.qty * item.price}/-</b>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div>
        <div className="bg-white rounded-2xl shadow-soft p-5 sticky top-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Items</span>
              <span className="font-medium">Rs {itemsPrice.toFixed(2)}/-</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">GST (18%)</span>
              <span className="font-medium">Rs {taxPrice.toFixed(2)}/-</span>
            </div>
            <div className="flex justify-between py-3 font-bold text-base">
              <span>Total</span>
              <span>Rs {totalPrice.toFixed(2)}/-</span>
            </div>
          </div>
          <button
            type="button"
            className="w-full bg-brand-600 text-white py-2.5 mt-2 rounded-lg font-semibold hover:bg-brand-700 disabled:bg-slate-300 transition-colors"
            disabled={cart.cartItems.length === 0}
            onClick={placeOrderHandler}
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrderPage;
