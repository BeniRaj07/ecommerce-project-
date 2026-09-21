import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import AdminLayout from '../../components/AdminLayout';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { SHIPPING_STAGE_LABELS } from '../../data/orderStatus';

// Admin can only ever advance an order one shipping stage at a time —
// mirrors the backend's SHIPPING_TRANSITIONS map.
const NEXT_SHIP_STATUS = {
  pending: 'to_ship',
  to_ship: 'shipped',
  shipped: 'to_receive',
  to_receive: 'delivered',
};

const OrderListPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/api/orders');
      setOrders(data);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const runAction = async (orderId, url, confirmMsg, successMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusyId(orderId);
    try {
      await API.put(url, {});
      toast.success(successMsg);
      fetchOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setBusyId(null);
    }
  };

  const advanceStatus = (order) => {
    const next = NEXT_SHIP_STATUS[order.orderStatus];
    if (!next) return;
    if (!window.confirm(`Mark this order as "${SHIPPING_STAGE_LABELS[next]}"?`)) return;
    setBusyId(order._id);
    API.put(`/api/orders/${order._id}/status`, { status: next })
      .then(() => {
        toast.success('Order status updated');
        fetchOrders();
      })
      .catch((error) => toast.error(error?.response?.data?.message || error.message))
      .finally(() => setBusyId(null));
  };

  const approveCancellation = (order) =>
    runAction(order._id, `/api/orders/${order._id}/cancel/approve`, 'Approve this cancellation request?', 'Cancellation approved');
  const rejectCancellation = (order) =>
    runAction(order._id, `/api/orders/${order._id}/cancel/reject`, 'Reject this cancellation request?', 'Cancellation rejected');
  const approveReturn = (order) =>
    runAction(order._id, `/api/orders/${order._id}/return/approve`, 'Approve this return request?', 'Return approved');
  const rejectReturn = (order) =>
    runAction(order._id, `/api/orders/${order._id}/return/reject`, 'Reject this return request?', 'Return rejected');
  const markReturned = (order) =>
    runAction(order._id, `/api/orders/${order._id}/return/complete`, 'Mark this order as returned?', 'Order marked as returned');

  const renderActions = (order) => {
    const busy = busyId === order._id;

    if (order.orderStatus === 'cancel_requested') {
      return (
        <div className="flex flex-col items-start gap-1.5">
          <button disabled={busy} onClick={() => approveCancellation(order)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 disabled:opacity-50">Approve Cancellation</button>
          <button disabled={busy} onClick={() => rejectCancellation(order)} className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50">Reject Cancellation</button>
        </div>
      );
    }

    if (order.orderStatus === 'return_requested') {
      return (
        <div className="flex flex-col items-start gap-1.5">
          <button disabled={busy} onClick={() => approveReturn(order)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 disabled:opacity-50">Approve Return</button>
          <button disabled={busy} onClick={() => rejectReturn(order)} className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50">Reject Return</button>
        </div>
      );
    }

    if (order.orderStatus === 'return_approved') {
      return (
        <button disabled={busy} onClick={() => markReturned(order)} className="text-xs font-semibold text-brand-600 hover:text-brand-800 disabled:opacity-50">Mark Returned</button>
      );
    }

    if (NEXT_SHIP_STATUS[order.orderStatus]) {
      return (
        <button disabled={busy} onClick={() => advanceStatus(order)} className="text-xs font-semibold text-brand-600 hover:text-brand-800 disabled:opacity-50">
          Mark as {SHIPPING_STAGE_LABELS[NEXT_SHIP_STATUS[order.orderStatus]]}
        </button>
      );
    }

    return <span className="text-xs text-slate-400">—</span>;
  };

  return (
    <AdminLayout title="Orders">
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        {loading ? (
          <div className="py-12"><Loader /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="py-3 px-4 font-semibold">Order</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Payment</th>
                  <th className="py-3 px-4 font-semibold">Total</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Review</th>
                  <th className="py-3 px-4 font-semibold">Actions</th>
                  <th className="py-3 px-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const reviewedCount = order.orderItems.filter((i) => i.reviewed).length;
                  return (
                    <tr key={order._id} className="hover:bg-slate-50 align-top">
                      <td className="py-3 px-4">
                        <p className="text-xs font-mono text-slate-500">{order._id.slice(-8)}</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-[180px] truncate" title={order.orderItems.map((i) => i.name).join(', ')}>
                          {order.orderItems.map((i) => i.name).join(', ')}
                        </p>
                        <p className="text-xs text-slate-400">{order.shippingAddress?.address}, {order.shippingAddress?.location}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{order.user?.name}</p>
                        <p className="text-xs text-slate-500">{order.user?.email}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{order.paymentMethod}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">Rs {order.totalPrice}/-</td>
                      <td className="py-3 px-4">
                        <OrderStatusBadge status={order.orderStatus} />
                        {order.orderStatus === 'cancel_requested' && (
                          <p className="text-[11px] text-slate-500 mt-1 max-w-[140px]">Reason: {order.cancelRequest?.reason}</p>
                        )}
                        {order.orderStatus === 'return_requested' && (
                          <p className="text-[11px] text-slate-500 mt-1 max-w-[140px]">Reason: {order.returnRequest?.reason}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {order.orderStatus === 'delivered' ? `${reviewedCount}/${order.orderItems.length} reviewed` : '—'}
                      </td>
                      <td className="py-3 px-4">{renderActions(order)}</td>
                      <td className="py-3 px-4">
                        <Link to={`/order/${order._id}`} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors whitespace-nowrap">
                          Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default OrderListPage;
