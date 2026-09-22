import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import API from '../api';
import { setCredentials } from '../store/slices/authSlice';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';

const ProfilePage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {

        const { data } = await API.get('/api/orders/myorders');
        setOrders(data);
      } catch (error) {
        toast.error(error?.response?.data?.message || error.message);
      } finally {
        setLoadingOrders(false);
      }
    };

    if (userInfo) {
      setName(userInfo.name);
      setEmail(userInfo.email);
      if (!userInfo.isAdmin) {
        fetchOrders();
      } else {
        setLoadingOrders(false);
      }
    }
  }, [userInfo]);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
    } else {
      setLoadingUpdate(true);
      try {

        const { data } = await API.put('/api/users/profile', { name, email, password });
        dispatch(setCredentials(data));
        toast.success('Profile Updated Successfully');
      } catch (error) {
        toast.error(error?.response?.data?.message || error.message);
      } finally {
        setLoadingUpdate(false);
      }
    }
  };

  const profileForm = (
    <div>
      <h2 className="text-xl font-bold mb-4 text-slate-900">User Profile</h2>
      {loadingUpdate && <Loader />}
      <form onSubmit={submitHandler} className="bg-white shadow-soft rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-slate-600 text-sm font-semibold mb-1.5">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-slate-200 rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-slate-600 text-sm font-semibold mb-1.5">Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-200 rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-slate-600 text-sm font-semibold mb-1.5">Password</label>
          <input type="password" placeholder="Enter new password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-200 rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-slate-600 text-sm font-semibold mb-1.5">Confirm Password</label>
          <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border border-slate-200 rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-full transition-colors" disabled={loadingUpdate}>
          Update
        </button>
      </form>
    </div>
  );

  if (userInfo?.isAdmin) {
    return <div className="max-w-md mx-auto">{profileForm}</div>;
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-1">{profileForm}</div>

      {/* My Orders Section */}
      <div className="md:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">My Orders</h2>
          <Link to="/orders" className="text-sm font-semibold text-brand-600 hover:text-brand-800">View all orders</Link>
        </div>
        {loadingOrders ? (
          <Loader />
        ) : orders.length === 0 ? (
          <p className="p-6 bg-white rounded-2xl shadow-soft text-center text-slate-500">You haven't placed any orders yet.</p>
        ) : (
          <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                    <th className="py-3 px-4 font-semibold">Order ID</th>
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
                      <td className="py-3 px-4 text-xs font-mono text-slate-500">{order._id.slice(-8)}</td>
                      <td className="py-3 px-4 text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">Rs {order.totalPrice}/-</td>
                      <td className="py-3 px-4">
                        {order.isPaid ? (
                          <span className="bg-emerald-50 text-emerald-700 py-1 px-3 rounded-full text-xs font-semibold">Paid</span>
                        ) : (
                          <span className="bg-red-50 text-red-600 py-1 px-3 rounded-full text-xs font-semibold">Not Paid</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {order.isDelivered ? (
                          <span className="bg-emerald-50 text-emerald-700 py-1 px-3 rounded-full text-xs font-semibold">Delivered</span>
                        ) : (
                          <span className="bg-red-50 text-red-600 py-1 px-3 rounded-full text-xs font-semibold">Not Delivered</span>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
