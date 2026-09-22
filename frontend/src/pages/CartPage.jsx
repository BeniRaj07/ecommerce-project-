import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, removeFromCart } from '../store/slices/cartSlice';
import { FaTrash, FaShoppingBag } from 'react-icons/fa';
import ProductImage from '../components/ProductImage';

const CartPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const cart = useSelector((state) => state.cart);
  const { cartItems } = cart;

  const addToCartHandler = (product, qty) => {
    dispatch(addToCart({ ...product, qty }));
  };

  const removeFromCartHandler = (id) => {
    dispatch(removeFromCart(id));
  };

  const checkoutHandler = () => {
    navigate('/login?redirect=/shipping');
  };

  const itemsTotal = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);
  const tax = itemsTotal * 0.18;

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <h1 className="font-display text-2xl font-bold mb-6">Shopping Cart</h1>
        {cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-soft p-10 text-center">
            <FaShoppingBag className="mx-auto text-4xl text-slate-300 mb-3" />
            <p className="text-slate-500 mb-4">Your cart is empty</p>
            <Link to="/" className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 px-5 rounded-full text-sm transition-colors">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-soft divide-y divide-slate-100">
            {cartItems.map((item) => (
              <div key={item._id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-4 min-w-0">
                  <ProductImage src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                  <div className="min-w-0">
                    <Link to={`/product/${item._id}`} className="font-medium text-slate-800 hover:text-brand-600 truncate block">{item.name}</Link>
                    {(item.selectedSize || item.selectedColor) && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.selectedSize && `Size: ${item.selectedSize}`}
                        {item.selectedSize && item.selectedColor && ' · '}
                        {item.selectedColor && `Color: ${item.selectedColor}`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="font-semibold text-slate-800 whitespace-nowrap">Rs {item.price}/-</div>
                <select
                  value={item.qty}
                  onChange={(e) => addToCartHandler(item, Number(e.target.value))}
                  className="border border-slate-200 rounded-lg p-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {[...Array(item.countInStock).keys()].map((x) => (
                    <option key={x + 1} value={x + 1}>{x + 1}</option>
                  ))}
                </select>
                <button onClick={() => removeFromCartHandler(item._id)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="bg-white rounded-2xl shadow-soft p-5 sticky top-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-4">Price Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Price ({cartItems.reduce((acc, item) => acc + item.qty, 0)} items)</span>
              <span className="font-medium">Rs {itemsTotal.toFixed(2)}/-</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">GST (18%)</span>
              <span className="font-medium">+ Rs {tax.toFixed(2)}/-</span>
            </div>
            <div className="flex justify-between py-3 font-bold text-base">
              <span>Total Amount</span>
              <span>Rs {(itemsTotal + tax).toFixed(2)}/-</span>
            </div>
          </div>
          <button
            className="w-full bg-brand-600 text-white py-2.5 mt-2 rounded-full font-semibold hover:bg-brand-700 disabled:bg-slate-300 transition-colors"
            disabled={cartItems.length === 0}
            onClick={checkoutHandler}
          >
            Proceed To Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
