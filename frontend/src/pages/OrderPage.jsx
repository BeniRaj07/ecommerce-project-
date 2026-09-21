import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import API from '../api';
import Loader from '../components/Loader';
import ProductImage from '../components/ProductImage';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';
import EsewaCheckout from '../components/EsewaCheckout';
import OrderStatusBadge from '../components/OrderStatusBadge';
import OrderStatusTimeline from '../components/OrderStatusTimeline';
import RequestReasonModal from '../components/RequestReasonModal';
import ReviewModal from '../components/ReviewModal';
import { clearCartItems } from '../store/slices/cartSlice';
import { CANCEL_REASONS, RETURN_REASONS, canRequestCancellation, canRequestReturn } from '../data/orderStatus';
import { toast } from 'react-toastify';
import { FaCheck } from 'react-icons/fa';


const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const OrderPage = () => {
  const { id: orderId, esewaStatus } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [justPaid, setJustPaid] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const verifiedRef = useRef(false);

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
    // Wait for the initial order fetch to land first, so its response can
    // never resolve after (and overwrite) the freshly-verified paid order.
    if (!esewaStatus || !userInfo || !order || verifiedRef.current) return;
    verifiedRef.current = true;

    if (esewaStatus === 'success') {
      API.post(`/api/orders/${orderId}/esewa/verify`)
        .then(({ data }) => {
          setOrder(data);
          setJustPaid(true);
          // Payment is confirmed by the backend and the order already
          // exists in the DB at this point, so it's now safe to clear.
          dispatch(clearCartItems());
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
  }, [esewaStatus, orderId, userInfo, order, dispatch]);

  const cancelOrderHandler = async ({ reason, details }) => {
    setActionSubmitting(true);
    try {
      const { data } = await API.put(`/api/orders/${orderId}/cancel-request`, { reason, details });
      setOrder(data);
      setShowCancelModal(false);
      toast.success('Cancellation requested. Awaiting admin review.');
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const returnOrderHandler = async ({ reason, details }) => {
    setActionSubmitting(true);
    try {
      const { data } = await API.put(`/api/orders/${orderId}/return-request`, { reason, details });
      setOrder(data);
      setShowReturnModal(false);
      toast.success('Return requested. Awaiting admin review.');
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const reviewSubmitHandler = async ({ rating, comment }) => {
    setReviewSubmitting(true);
    try {
      await API.post(`/api/products/${reviewItem.product}/reviews`, { rating, comment, orderId });
      toast.success('Review submitted!');
      setReviewItem(null);
      fetchOrder();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) return <Loader />;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    order && (
      <>
        {justPaid && (
          <div className="bg-white rounded-2xl shadow-soft p-8 mb-6 flex flex-col items-center text-center">
            <span className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mb-4">
              <FaCheck />
            </span>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Payment Successful!</h2>
            <p className="text-sm text-slate-500 mb-5">Your order has been paid and is being processed.</p>
            <button
              onClick={() => navigate('/')}
              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 px-8 rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        )}
        <h1 className="text-2xl font-bold mb-6 text-slate-900">Order <span className="text-slate-400 font-mono text-lg">{order._id}</span></h1>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column: Details */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-soft p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Shipping</h2>
                <OrderStatusBadge status={order.orderStatus} />
              </div>

              <div className="mb-5 overflow-x-auto">
                <OrderStatusTimeline status={order.orderStatus} cancelPreviousStatus={order.cancelRequest?.previousStatus} />
              </div>

              <p className="text-sm text-slate-600"><strong className="text-slate-800">Name: </strong> {order.user.name}</p>
              <p className="text-sm text-slate-600"><strong className="text-slate-800">Email: </strong> <a href={`mailto:${order.user.email}`} className="text-brand-600 hover:underline">{order.user.email}</a></p>
              <p className="text-sm text-slate-600"><strong className="text-slate-800">Address: </strong>{order.shippingAddress.address}, {order.shippingAddress.location}</p>

              {order.orderStatus === 'cancel_requested' && (
                <p className="mt-3 text-sm text-amber-800 bg-amber-50 rounded-lg p-3">
                  Cancellation requested ({order.cancelRequest.reason}) — awaiting admin review.
                </p>
              )}
              {order.orderStatus === 'cancelled' && (
                <p className="mt-3 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                  Cancelled{order.cancelRequest?.reason ? ` — reason: ${order.cancelRequest.reason}` : ''}
                </p>
              )}
              {order.orderStatus === 'return_requested' && (
                <p className="mt-3 text-sm text-amber-800 bg-amber-50 rounded-lg p-3">
                  Return requested ({order.returnRequest.reason}) — awaiting admin review.
                </p>
              )}
              {order.orderStatus === 'return_approved' && (
                <p className="mt-3 text-sm text-blue-700 bg-blue-50 rounded-lg p-3">Return approved — please ship the item back to the maker.</p>
              )}
              {order.orderStatus === 'return_rejected' && (
                <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg p-3">Return request was rejected.</p>
              )}
              {order.orderStatus === 'returned' && (
                <p className="mt-3 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">Item returned.</p>
              )}

              {(canRequestCancellation(order.orderStatus) || canRequestReturn(order.orderStatus)) && (
                <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100">
                  {canRequestCancellation(order.orderStatus) && (
                    <button onClick={() => setShowCancelModal(true)} className="text-sm font-semibold text-red-600 hover:text-red-700">
                      Cancel Order
                    </button>
                  )}
                  {canRequestReturn(order.orderStatus) && (
                    <button onClick={() => setShowReturnModal(true)} className="text-sm font-semibold text-brand-600 hover:text-brand-800">
                      Request Return
                    </button>
                  )}
                </div>
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
                  <div key={index} className="flex items-center justify-between py-3 gap-3 flex-wrap">
                    <div className="flex items-center gap-4 min-w-0">
                      <ProductImage src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                      <Link to={`/product/${item.product}`} className="text-sm font-medium text-slate-800 hover:text-brand-600 truncate">{item.name}</Link>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-slate-600 whitespace-nowrap">{item.qty} x Rs {item.price}/- = <b className="text-slate-900">Rs {(item.qty * item.price).toFixed(2)}/-</b></div>
                      {order.orderStatus === 'delivered' && (
                        item.reviewed ? (
                          <span className="text-xs font-semibold text-emerald-600 whitespace-nowrap">Reviewed</span>
                        ) : (
                          <button
                            onClick={() => setReviewItem(item)}
                            className="text-xs font-semibold text-brand-600 hover:text-brand-800 whitespace-nowrap"
                          >
                            Write a Review
                          </button>
                        )
                      )}
                    </div>
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
                    <CheckoutForm
                      order={order}
                      refetchOrder={fetchOrder}
                      onSuccess={() => {
                        setJustPaid(true);
                        dispatch(clearCartItems());
                      }}
                    />
                  </Elements>
                </div>
              )}
            </div>
          </div>
        </div>

        {showCancelModal && (
          <RequestReasonModal
            title="Cancel Order"
            reasons={CANCEL_REASONS}
            confirmLabel="Confirm Cancellation"
            submitting={actionSubmitting}
            onClose={() => setShowCancelModal(false)}
            onConfirm={cancelOrderHandler}
          />
        )}

        {showReturnModal && (
          <RequestReasonModal
            title="Request Return"
            reasons={RETURN_REASONS}
            confirmLabel="Submit Return Request"
            submitting={actionSubmitting}
            onClose={() => setShowReturnModal(false)}
            onConfirm={returnOrderHandler}
          />
        )}

        {reviewItem && (
          <ReviewModal
            item={reviewItem}
            submitting={reviewSubmitting}
            onMaybeLater={() => setReviewItem(null)}
            onSubmit={reviewSubmitHandler}
          />
        )}
      </>
    )
  );
};

export default OrderPage;
