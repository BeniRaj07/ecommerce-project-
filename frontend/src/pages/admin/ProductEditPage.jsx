import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API from '../../api';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import AdminLayout from '../../components/AdminLayout';
import ProductImage from '../../components/ProductImage';
import { footwearCategories, makerLocations, stockTypes } from '../../data/categories';

const inputClass = 'w-full rounded-lg border border-slate-200 py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent';
const labelClass = 'block text-slate-600 text-sm font-semibold mb-1.5';

const ProductEditPage = () => {
  const { id: productId } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [image, setImage] = useState('');
  const [brand, setBrand] = useState('');
  const [mainCategory, setMainCategory] = useState(footwearCategories[0].name);
  const [subCategory, setSubCategory] = useState(footwearCategories[0].subCategories[0]);
  const [countInStock, setCountInStock] = useState(0);
  const [description, setDescription] = useState('');
  const [sizes, setSizes] = useState('');
  const [colors, setColors] = useState('');
  const [material, setMaterial] = useState('');
  const [makerName, setMakerName] = useState('');
  const [makerLocation, setMakerLocation] = useState(makerLocations[0].value);
  const [isHandmade, setIsHandmade] = useState(false);
  const [madeInNepal, setMadeInNepal] = useState(true);
  const [stockType, setStockType] = useState(stockTypes[0]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const availableSubCategories =
    footwearCategories.find((c) => c.name === mainCategory)?.subCategories || [];

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await API.get(`/api/products/${productId}`);
        setName(data.name);
        setPrice(data.price);
        setImage(data.image);
        setBrand(data.brand);
        setMainCategory(data.mainCategory || footwearCategories[0].name);
        setSubCategory(data.subCategory || footwearCategories[0].subCategories[0]);
        setCountInStock(data.countInStock);
        setDescription(data.description);
        setSizes((data.sizes || []).join(', '));
        setColors((data.colors || []).join(', '));
        setMaterial(data.material || '');
        setMakerName(data.maker?.name || '');
        setMakerLocation(data.maker?.location || makerLocations[0].value);
        setIsHandmade(Boolean(data.isHandmade));
        setMadeInNepal(data.madeInNepal !== false);
        setStockType(data.stockType || stockTypes[0]);
      } catch (error) {
        toast.error(error?.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const mainCategoryChangeHandler = (value) => {
    setMainCategory(value);
    const subs = footwearCategories.find((c) => c.name === value)?.subCategories || [];
    setSubCategory(subs[0] || '');
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        name,
        price,
        image,
        brand,
        mainCategory,
        subCategory,
        countInStock,
        description,
        sizes: sizes.split(',').map((s) => Number(s.trim())).filter((s) => !Number.isNaN(s)),
        colors: colors.split(',').map((c) => c.trim()).filter(Boolean),
        material,
        maker: { name: makerName, location: makerLocation },
        isHandmade,
        madeInNepal,
        stockType,
      };

      await API.put(`/api/products/${productId}`, productData);
      toast.success('Product updated successfully');
      navigate('/admin/productlist');
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  const uploadFileHandler = async (e) => {
    const formData = new FormData();
    formData.append('image', e.target.files[0]);
    setUploading(true);
    try {

      const { data } = await API.post('/api/upload', formData);
      setImage(data.image);
      toast.success('Image uploaded successfully');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const backButton = (
    <Link to="/admin/productlist" className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
      &larr; Back to Products
    </Link>
  );

  return (
    <AdminLayout title="Edit Product" actions={backButton}>
      {loading ? (
        <Loader />
      ) : (
        <form onSubmit={submitHandler} className="bg-white rounded-2xl shadow-soft p-6 max-w-3xl space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Price (Rs)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Image</label>
            <div className="flex items-center gap-4">
              {image && <ProductImage src={image} alt="preview" className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-slate-100" />}
              <div className="flex-1 space-y-2">
                <input type="text" value={image} onChange={(e) => setImage(e.target.value)} className={inputClass} />
                <input type="file" onChange={uploadFileHandler} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
                {uploading && <Loader />}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Brand</label>
              <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Count In Stock</label>
              <input type="number" value={countInStock} onChange={(e) => setCountInStock(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Category</label>
              <select value={mainCategory} onChange={(e) => mainCategoryChangeHandler(e.target.value)} className={inputClass}>
                {footwearCategories.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Sub-Category</label>
              <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className={inputClass}>
                {availableSubCategories.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Sizes (comma separated)</label>
              <input type="text" placeholder="e.g. 39, 40, 41, 42" value={sizes} onChange={(e) => setSizes(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Colors (comma separated)</label>
              <input type="text" placeholder="e.g. Black, Brown" value={colors} onChange={(e) => setColors(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Material</label>
            <input type="text" placeholder="e.g. Genuine Leather" value={material} onChange={(e) => setMaterial(e.target.value)} className={inputClass} />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Maker / Seller Name</label>
              <input type="text" value={makerName} onChange={(e) => setMakerName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Maker Location</label>
              <select value={makerLocation} onChange={(e) => setMakerLocation(e.target.value)} className={inputClass}>
                {makerLocations.map((l) => (
                  <option key={l.value} value={l.value}>{l.value}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Stock Type</label>
            <select value={stockType} onChange={(e) => setStockType(e.target.value)} className={inputClass}>
              {stockTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <input type="checkbox" checked={isHandmade} onChange={(e) => setIsHandmade(e.target.checked)} className="rounded text-brand-600 focus:ring-brand-500" />
              Handmade
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <input type="checkbox" checked={madeInNepal} onChange={(e) => setMadeInNepal(e.target.checked)} className="rounded text-brand-600 focus:ring-brand-500" />
              Made in Nepal
            </label>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputClass} />
          </div>

          <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-full transition-colors">
            Update Product
          </button>
        </form>
      )}
    </AdminLayout>
  );
};

export default ProductEditPage;
