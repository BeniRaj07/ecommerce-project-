import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import AdminLayout from '../../components/AdminLayout';
import ProductImage from '../../components/ProductImage';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { getNextOrderAction } from '../../data/orderStatus';

const currency = (n) => `Rs ${Number(n || 0).toLocaleString('en-IN')}/-`;
const formatDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

const TABS = [
  { key: 'all', label: 'All Orders' },
  { key: 'cancellation', label: 'Cancellation Requests' },
  { key: 'return', label: 'Return Requests' },
];

const OrderListPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [tab, setTab] = useState('all');

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

  const runAction = async (orderId, url, body, successMsg) => {
    // Belt-and-suspenders: ignore a second call for the same order even if
    // it somehow fires before the disabled state re-renders (e.g. a fast
    // repeated key press), so the status API is never hit twice at once.
    if (busyId === orderId) return;
    setBusyId(orderId);
    try {
      await API.put(url, body || {});
      toast.success(successMsg);
      fetchOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setBusyId(null);
    }
  };

  const advanceStatus = (order) => {
    const action = getNextOrderAction(order);
    if (!action) return;
    if (!window.confirm(`${action.label}?`)) return;
    runAction(order._id, `/api/orders/${order._id}/status`, { status: action.nextStatus }, 'Order status updated');
  };

  const approveCancellation = (order) => {
    if (!window.confirm('Approve this cancellation request? Stock will be restored.')) return;
    runAction(order._id, `/api/orders/${order._id}/cancel/approve`, {}, 'Cancellation approved');
  };
  const rejectCancellation = (order) => {
    if (!window.confirm('Reject this cancellation request?')) return;
    const adminNote = window.prompt('Optional note for the customer (leave blank to skip):') || undefined;
    runAction(order._id, `/api/orders/${order._id}/cancel/reject`, { adminNote }, 'Cancellation rejected');
  };
  const approveReturn = (order) => {
    if (!window.confirm('Approve this return request?')) return;
    runAction(order._id, `/api/orders/${order._id}/return/approve`, {}, 'Return approved');
  };
  const rejectReturn = (order) => {
    if (!window.confirm('Reject this return request?')) return;
    const adminNote = window.prompt('Optional note for the customer (leave blank to skip):') || undefined;
    runAction(order._id, `/api/orders/${order._id}/return/reject`, { adminNote }, 'Return rejected');
  };
  const markReturned = (order) => {
    if (!window.confirm('Mark this order as returned?')) return;
    const restock = window.confirm('Restock the returned item(s) back into inventory?\n\nOK = Yes, restock. Cancel = No, do not restock (e.g. damaged item).');
    runAction(order._id, `/api/orders/${order._id}/return/complete`, { restock }, 'Order marked as returned');
  };

  const renderActions = (order) => {
    const busy = busyId === order._id;

    if (busy) {
      return <span className="text-xs font-semibold text-slate-400">Updating...</span>;
    }

    if (order.orderStatus === 'cancel_requested') {
      return (
        <div className="flex flex-col items-start gap-1.5">
          <button onClick={() => approveCancellation(order)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-800">Approve Cancellation</button>
          <button onClick={() => rejectCancellation(order)} className="text-xs font-semibold text-red-500 hover:text-red-700">Reject Cancellation</button>
        </div>
      );
    }

    if (order.orderStatus === 'return_requested') {
      return (
        <div className="flex flex-col items-start gap-1.5">
          <button onClick={() => approveReturn(order)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-800">Approve Return</button>
          <button onClick={() => rejectReturn(order)} className="text-xs font-semibold text-red-500 hover:text-red-700">Reject Return</button>
        </div>
      );
    }

    if (order.orderStatus === 'return_approved') {
      return (
        <button onClick={() => markReturned(order)} className="text-xs font-semibold text-brand-600 hover:text-brand-800">Mark Returned</button>
      );
    }

    const action = getNextOrderAction(order);
    if (action) {
      return (
        <button disabled={busy} onClick={() => advanceStatus(order)} className="text-xs font-semibold text-brand-600 hover:text-brand-800 disabled:opacity-50">
          {busy ? 'Updating...' : action.label}
        </button>
      );
    }

    return <span className="text-xs text-slate-400">—</span>;
  };

  const cancellationOrders = orders.filter((o) => o.orderStatus === 'cancel_requested');
  const returnOrders = orders.filter((o) => o.orderStatus === 'return_requested');

  const RequestCard = ({ order, kind }) => {
    const busy = busyId === order._id;
    const request = kind === 'cancellation' ? order.cancelRequest : order.returnRequest;

    return (
      <div className="bg-white rounded-2xl shadow-soft p-5">
        <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
          <div>
            <h3 className="font-bold text-slate-900">{kind === 'cancellation' ? 'Cancellation Request' : 'Return Request'}</h3>
            <p className="text-xs font-mono text-slate-500 mt-0.5">Order #{order._id.slice(-8).toUpperCase()}</p>
          </div>
          <OrderStatusBadge status={order.orderStatus} />
        </div>

        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm mb-4">
          <p className="text-slate-600"><strong className="text-slate-800">Customer:</strong> {order.user?.name}</p>
          <p className="text-slate-600"><strong className="text-slate-800">Email:</strong> {order.user?.email}</p>
          <p className="text-slate-600"><strong className="text-slate-800">Order Date:</strong> {formatDateTime(order.createdAt)}</p>
          <p className="text-slate-600"><strong className="text-slate-800">Order Total:</strong> {currency(order.totalPrice)}</p>
          {kind === 'return' && (
            <p className="text-slate-600"><strong className="text-slate-800">Delivered:</strong> {formatDateTime(order.deliveredAt)}</p>
          )}
          <p className="text-slate-600">
            <strong className="text-slate-800">Requested:</strong> {formatDateTime(request?.requestedAt)}
          </p>
        </div>

        <div className="divide-y divide-slate-100 border-y border-slate-100 mb-4">
          {order.orderItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 py-2.5">
              <ProductImage src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                <p className="text-xs text-slate-500">
                  {item.selectedSize && `Size: ${item.selectedSize} · `}Qty: {item.qty} · {currency(item.price)} each
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 rounded-xl p-3 mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Reason</p>
          <p className="text-sm text-slate-700">{request?.reason || '—'}</p>
          {request?.details && (
            <>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-2 mb-1">Additional details</p>
              <p className="text-sm text-slate-700">{request.details}</p>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {kind === 'cancellation' ? (
            <>
              <button disabled={busy} onClick={() => approveCancellation(order)} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-semibold py-2 px-4 rounded-full transition-colors">Approve Cancellation</button>
              <button disabled={busy} onClick={() => rejectCancellation(order)} className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-sm font-semibold py-2 px-4 rounded-full transition-colors">Reject Request</button>
            </>
          ) : (
            <>
              <button disabled={busy} onClick={() => approveReturn(order)} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-semibold py-2 px-4 rounded-full transition-colors">Approve Return</button>
              <button disabled={busy} onClick={() => rejectReturn(order)} className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-sm font-semibold py-2 px-4 rounded-full transition-colors">Reject Request</button>
            </>
          )}
          <Link to={`/order/${order._id}`} className="text-sm font-semibold text-brand-600 hover:text-brand-800 ml-auto">View Full Order</Link>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout title="Orders">
      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map((t) => {
          const count = t.key === 'cancellation' ? cancellationOrders.length : t.key === 'return' ? returnOrders.length : null;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
                tab === t.key ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {t.label}{count !== null && count > 0 ? ` (${count})` : ''}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-12"><Loader /></div>
      ) : tab === 'cancellation' ? (
        cancellationOrders.length === 0 ? (
          <p className="p-10 bg-white rounded-2xl shadow-soft text-center text-slate-500">No pending cancellation requests.</p>
        ) : (
          <div className="space-y-4">
            {cancellationOrders.map((order) => <RequestCard key={order._id} order={order} kind="cancellation" />)}
          </div>
        )
      ) : tab === 'return' ? (
        returnOrders.length === 0 ? (
          <p className="p-10 bg-white rounded-2xl shadow-soft text-center text-slate-500">No pending return requests.</p>
        ) : (
          <div className="space-y-4">
            {returnOrders.map((order) => <RequestCard key={order._id} order={order} kind="return" />)}
          </div>
        )
      ) : (
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
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
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {order.paymentMethod}
                        <span className="block text-[11px] text-slate-400 capitalize">{order.paymentStatus}</span>
                      </td>
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
        </div>
      )}
    </AdminLayout>
  );
};

export default OrderListPage;
