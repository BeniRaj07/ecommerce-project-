import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import AdminLayout from '../../components/AdminLayout';
import { FaCheck, FaTrash } from 'react-icons/fa';

const UserListPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        
        const { data } = await API.get('/api/users');
        setUsers(data);
      } catch (error) {
        toast.error(error?.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []); 

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        
        await API.delete(`/api/users/${id}`);
        setUsers(users.filter((user) => user._id !== id));
        toast.success('User deleted');
      } catch (error) {
        toast.error(error?.response?.data?.message || error.message);
      }
    }
  };

  return (
    <AdminLayout title="Users">
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        {loading ? (
          <div className="py-12"><Loader /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                        <span className="font-medium text-slate-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4"><a href={`mailto:${user.email}`} className="text-brand-600 hover:underline">{user.email}</a></td>
                    <td className="py-3 px-4">
                      {user.isAdmin ? (
                        <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                          <FaCheck /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-xs font-semibold px-2.5 py-1 rounded-full">
                          Customer
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => deleteHandler(user._id)} className="text-slate-400 hover:text-red-500">
                        <FaTrash />
                      </button>
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

export default UserListPage;