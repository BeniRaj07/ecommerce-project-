import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import AdminLayout from '../../components/AdminLayout';
import { FaTimes } from 'react-icons/fa';

const OrderListPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const deliverHandler = async (orderId) => {
    if (window.confirm('Mark this order as delivered?')) {
      try {
        
        await API.put(`/api/orders/${orderId}/deliver`, {});
        toast.success('Order marked as delivered');
        fetchOrders(); 
      } catch (error) {
        toast.error(error?.response?.data?.message || error.message);
      }
    }
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
                  <th className="py-3 px-4 font-semibold">Order ID</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Total</th>
                  <th className="py-3 px-4 font-semibold">Paid</th>
                  <th className="py-3 px-4 font-semibold">Delivered</th>
                  <th className="py-3 px-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-500 text-xs font-mono">{order._id.slice(-8)}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{order.user && order.user.name}</td>
                    <td className="py-3 px-4 text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">Rs {order.totalPrice}/-</td>
                    <td className="py-3 px-4">
                      {order.isPaid ? (
                        <span className="inline-flex items-center bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                          {new Date(order.paidAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                          <FaTimes /> Unpaid
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {order.isDelivered ? (
                        <span className="inline-flex items-center bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                          {new Date(order.deliveredAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <button onClick={() => deliverHandler(order._id)} className="text-xs font-semibold text-brand-600 hover:text-brand-800">
                          Mark Delivered
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Link to={`/order/${order._id}`} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors">
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default OrderListPage;