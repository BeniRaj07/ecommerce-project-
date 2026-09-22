import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import ProductImage from '../components/ProductImage';
import OrderStatusBadge from '../components/OrderStatusBadge';
import {
  canRequestCancellation,
  canRequestReturn,
  CANCEL_FLOW_STATUSES,
  RETURN_FLOW_STATUSES,
} from '../data/orderStatus';

const TABS = [
  { key: 'all', label: 'All Orders' },
  { key: 'to_ship', label: 'To Ship' },
  { key: 'to_receive', label: 'To Receive' },
  { key: 'to_review', label: 'To Review' },
  { key: 'cancelled_returns', label: 'Cancelled / Returns' },
];

const matchesTab = (order, tab) => {
  switch (tab) {
    case 'to_ship':
      return ['pending', 'to_ship'].includes(order.orderStatus);
    case 'to_receive':
      return ['shipped', 'to_receive'].includes(order.orderStatus);
    case 'to_review':
      return order.orderStatus === 'delivered' && order.orderItems.some((i) => !i.reviewed);
    case 'cancelled_returns':
      return CANCEL_FLOW_STATUSES.includes(order.orderStatus) || RETURN_FLOW_STATUSES.includes(order.orderStatus);
    default:
      return true;
  }
};

const OrdersListPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data } = await API.get('/api/orders/myorders');
        setOrders([...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (error) {
        toast.error(error?.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) => matchesTab(order, tab));

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6 text-slate-900">My Orders</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
              tab === t.key ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : filteredOrders.length === 0 ? (
        <p className="p-10 bg-white rounded-2xl shadow-soft text-center text-slate-500">No orders in this section.</p>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-2xl shadow-soft p-5">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div>
                  <p className="font-bold text-slate-900">Order #{order._id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <OrderStatusBadge status={order.orderStatus} />
              </div>

              <div className="divide-y divide-slate-100 border-t border-slate-100">
                {order.orderItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 py-3">
                    <ProductImage src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.selectedSize && `Size: ${item.selectedSize}`}
                        {item.selectedSize && item.selectedColor && ' · '}
                        {item.selectedColor && `Color: ${item.selectedColor}`}
                        {(item.selectedSize || item.selectedColor) && ' · '}
                        Qty: {item.qty}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 whitespace-nowrap">Rs {item.price}/-</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100">
                <p className="font-bold text-slate-900">Total: Rs {order.totalPrice}/-</p>
                <div className="flex items-center gap-4">
                  <Link to={`/order/${order._id}`} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
                    View Details
                  </Link>
                  {canRequestCancellation(order.orderStatus) && (
                    <Link to={`/order/${order._id}`} className="text-sm font-semibold text-red-600 hover:text-red-700">
                      Cancel Order
                    </Link>
                  )}
                  {canRequestReturn(order.orderStatus) && (
                    <Link to={`/order/${order._id}`} className="text-sm font-semibold text-brand-600 hover:text-brand-800">
                      Request Return
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersListPage;
