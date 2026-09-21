import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import API from '../api';
import { setCredentials } from '../store/slices/authSlice';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import { FaUserShield } from 'react-icons/fa';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userInfo?.isAdmin) {
      navigate('/admin/dashboard');
    }
  }, [userInfo, navigate]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/api/users/admin/login', { email, password });
      dispatch(setCredentials(data));
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-900 shadow-card rounded-2xl">
        <Link to="/" className="flex justify-center items-center gap-2">
          <img src="/images/icons/footwear.png" alt="Juttax" className="h-8 w-8" />
          <span className="text-2xl font-extrabold tracking-tight text-white">Juttax</span>
        </Link>
        <div className="flex flex-col items-center gap-2">
          <span className="w-11 h-11 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center text-xl">
            <FaUserShield />
          </span>
          <h1 className="text-xl font-bold text-center text-white">Admin Sign In</h1>
          <p className="text-sm text-slate-400 text-center">Restricted to Juttax administrators</p>
        </div>
        {loading && <Loader />}
        <form onSubmit={submitHandler} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email Address</label>
            <input
              className="block w-full px-3 py-2.5 border border-slate-700 bg-slate-800 text-white rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Password</label>
            <input
              className="block w-full px-3 py-2.5 border border-slate-700 bg-slate-800 text-white rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:bg-slate-700 transition-colors"
            type="submit"
            disabled={loading}
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
