import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import AdminLayout from '../../components/AdminLayout';
import { footwearCategories } from '../../data/categories';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const navigate = useNavigate();

  const subOptions = footwearCategories.find((c) => c.name === categoryFilter)?.subCategories || [];

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Public endpoint, no token needed for getting all products
        const { data } = await API.get('/api/products', {
          params: {
            ...(categoryFilter ? { category: categoryFilter } : {}),
            ...(subFilter ? { sub: subFilter } : {}),
          },
        });
        setProducts(data);
      } catch (error) {
        toast.error(error?.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryFilter, subFilter]);

  const categoryChangeHandler = (value) => {
    setCategoryFilter(value);
    setSubFilter('');
  };

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await API.delete(`/api/products/${id}`);
        setProducts(products.filter((p) => p._id !== id));
        toast.success('Product deleted');
      } catch (error) {
        toast.error(error?.response?.data?.message || error.message);
      }
    }
  };

  const createProductHandler = async () => {
    if (window.confirm('Are you sure you want to create a new product?')) {
      try {
        const { data } = await API.post('/api/products', {});
        navigate(`/admin/product/${data._id}/edit`);
      } catch (error) {
        toast.error(error?.response?.data?.message || error.message);
      }
    }
  };

  const createButton = (
    <button onClick={createProductHandler} className="bg-brand-600 hover:bg-brand-700 text-white py-2 px-4 rounded-lg flex items-center text-sm font-semibold transition-colors">
      <FaPlus className="mr-2" /> Create Product
    </button>
  );

  return (
    <AdminLayout title="Products" actions={createButton}>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={categoryFilter}
          onChange={(e) => categoryChangeHandler(e.target.value)}
          className="border border-slate-200 rounded-lg py-2 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Categories</option>
          {footwearCategories.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
        <select
          value={subFilter}
          onChange={(e) => setSubFilter(e.target.value)}
          disabled={!categoryFilter}
          className="border border-slate-200 rounded-lg py-2 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="">All Sub-Categories</option>
          {subOptions.map((sub) => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>
        {(categoryFilter || subFilter) && (
          <button
            onClick={() => categoryChangeHandler('')}
            className="text-sm font-semibold text-brand-600 hover:text-brand-800"
          >
            Clear filters
          </button>
        )}
      </div>
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        {loading ? (
          <div className="py-12"><Loader /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="py-3 px-4 font-semibold">Product</th>
                  <th className="py-3 px-4 font-semibold">Price</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Maker</th>
                  <th className="py-3 px-4 font-semibold">Brand</th>
                  <th className="py-3 px-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 px-4 text-center text-slate-500">No products match this filter.</td>
                  </tr>
                )}
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-slate-100" />
                        <span className="font-medium text-slate-800">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">Rs {product.price}/-</td>
                    <td className="py-3 px-4">
                      <span className="inline-block bg-brand-50 text-brand-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {product.mainCategory} / {product.subCategory}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{product.maker?.name} · {product.maker?.location}</td>
                    <td className="py-3 px-4 text-slate-600">{product.brand}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Link to={`/admin/product/${product._id}/edit`} className="text-brand-600 hover:text-brand-800">
                          <FaEdit />
                        </Link>
                        <button onClick={() => deleteHandler(product._id)} className="text-slate-400 hover:text-red-500">
                          <FaTrash />
                        </button>
                      </div>
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

export default ProductListPage;