import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import API from '../api';
import Loader from '../components/Loader';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';
import EsewaCheckout from '../components/EsewaCheckout';
import { toast } from 'react-toastify';


const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const OrderPage = () => {
  const { id: orderId, esewaStatus } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { userInfo } = useSelector((state) => state.auth);

  const fetchOrder = async () => {
    try {

      const { data } = await API.get(`/api/orders/${orderId}`);
      setOrder(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    if (userInfo) {
      fetchOrder();
    }
  }, [orderId, userInfo]);

  useEffect(() => {
    if (!esewaStatus || !userInfo) return;

    if (esewaStatus === 'success') {
      API.post(`/api/orders/${orderId}/esewa/verify`)
        .then(({ data }) => {
          setOrder(data);
          toast.success('Payment Successful!');
        })
        .catch((err) => {
          toast.error(err?.response?.data?.message || err.message);
        })
        .finally(() => {
          navigate(`/order/${orderId}`, { replace: true });
        });
    } else if (esewaStatus === 'failure') {
      toast.error('eSewa payment was not completed.');
      navigate(`/order/${orderId}`, { replace: true });
    }
  }, [esewaStatus, orderId, userInfo]);

  if (loading) return <Loader />;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    order && (
      <>
        <h1 className="text-2xl font-bold mb-6 text-slate-900">Order <span className="text-slate-400 font-mono text-lg">{order._id}</span></h1>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column: Details */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-soft p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-3">Shipping</h2>
              <p className="text-sm text-slate-600"><strong className="text-slate-800">Name: </strong> {order.user.name}</p>
              <p className="text-sm text-slate-600"><strong className="text-slate-800">Email: </strong> <a href={`mailto:${order.user.email}`} className="text-brand-600 hover:underline">{order.user.email}</a></p>
              <p className="text-sm text-slate-600"><strong className="text-slate-800">Address: </strong>{order.shippingAddress.address}, {order.shippingAddress.location}</p>
              {order.isDelivered ? (
                <div className="mt-3 inline-block px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-full">Delivered on {new Date(order.deliveredAt).toLocaleDateString()}</div>
              ) : (
                <div className="mt-3 inline-block px-3 py-1.5 bg-red-50 text-red-600 text-sm font-semibold rounded-full">Not Delivered</div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-soft p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-3">Payment Method</h2>
              <p className="text-sm text-slate-600"><strong className="text-slate-800">Method: </strong>{order.paymentMethod}</p>
              {order.isPaid ? (
                <div className="mt-3 inline-block px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-full">Paid on {new Date(order.paidAt).toLocaleDateString()}</div>
              ) : (
                <div className="mt-3 inline-block px-3 py-1.5 bg-red-50 text-red-600 text-sm font-semibold rounded-full">Not Paid</div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-soft p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-3">Order Items</h2>
              <div className="divide-y divide-slate-100">
                {order.orderItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-4 min-w-0">
                      <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                      <Link to={`/product/${item.product}`} className="text-sm font-medium text-slate-800 hover:text-brand-600 truncate">{item.name}</Link>
                    </div>
                    <div className="text-sm text-slate-600 whitespace-nowrap">{item.qty} x Rs {item.price}/- = <b className="text-slate-900">Rs {(item.qty * item.price).toFixed(2)}/-</b></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Summary */}
          <div>
            <div className="bg-white rounded-2xl shadow-soft p-5 sticky top-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Items</span><span className="font-medium">Rs {order.itemsPrice}/-</span></div>
                <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">GST</span><span className="font-medium">Rs {order.taxPrice}/-</span></div>
                <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Shipping</span><span className="font-medium">Rs {order.shippingPrice}/-</span></div>
                <div className="flex justify-between py-3 font-bold text-base"><span>Total</span><span>Rs {order.totalPrice}/-</span></div>
              </div>

              {!order.isPaid && order.paymentMethod === 'eSewa' && (
                <div className="mt-4">
                  <EsewaCheckout order={order} />
                </div>
              )}

              {!order.isPaid && order.paymentMethod !== 'COD' && order.paymentMethod !== 'eSewa' && (
                <div className="mt-4">
                  <Elements stripe={stripePromise}>
                    <CheckoutForm order={order} refetchOrder={fetchOrder} />
                  </Elements>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    )
  );
};

export default OrderPage;
