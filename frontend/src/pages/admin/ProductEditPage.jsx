import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API from '../../api';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import { footwearCategories, makerLocations, stockTypes } from '../../data/categories';

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
    } catch (error) {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Link to="/admin/productlist" className="inline-block mb-4 bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded">
        Go Back
      </Link>
      <div className="flex justify-center">
        <div className="w-full max-w-lg">
          <h1 className="text-3xl font-bold mb-6">Edit Product</h1>
          {loading ? <Loader /> : (
            <form onSubmit={submitHandler} className="bg-white shadow-md rounded px-8 pt-6 pb-8">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3"/>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Price (Rs)</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3"/>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Image</label>
                <input type="text" value={image} onChange={(e) => setImage(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 mb-2"/>
                <input type="file" onChange={uploadFileHandler} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"/>
                {uploading && <Loader />}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Brand</label>
                <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3"/>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Count In Stock</label>
                <input type="number" value={countInStock} onChange={(e) => setCountInStock(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3"/>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Category</label>
                  <select value={mainCategory} onChange={(e) => mainCategoryChangeHandler(e.target.value)} className="shadow border rounded w-full py-2 px-3">
                    {footwearCategories.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Sub-Category</label>
                  <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="shadow border rounded w-full py-2 px-3">
                    {availableSubCategories.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Sizes (comma separated)</label>
                <input type="text" placeholder="e.g. 39, 40, 41, 42" value={sizes} onChange={(e) => setSizes(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3"/>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Colors (comma separated)</label>
                <input type="text" placeholder="e.g. Black, Brown" value={colors} onChange={(e) => setColors(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3"/>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Material</label>
                <input type="text" placeholder="e.g. Genuine Leather" value={material} onChange={(e) => setMaterial(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3"/>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Maker / Seller Name</label>
                  <input type="text" value={makerName} onChange={(e) => setMakerName(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3"/>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Maker Location</label>
                  <select value={makerLocation} onChange={(e) => setMakerLocation(e.target.value)} className="shadow border rounded w-full py-2 px-3">
                    {makerLocations.map((l) => (
                      <option key={l.value} value={l.value}>{l.value}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Stock Type</label>
                <select value={stockType} onChange={(e) => setStockType(e.target.value)} className="shadow border rounded w-full py-2 px-3">
                  {stockTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4 flex gap-6">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <input type="checkbox" checked={isHandmade} onChange={(e) => setIsHandmade(e.target.checked)} />
                  Handmade
                </label>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <input type="checkbox" checked={madeInNepal} onChange={(e) => setMadeInNepal(e.target.checked)} />
                  Made in Nepal
                </label>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3"/>
              </div>

              <button type="submit" className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                Update
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductEditPage;
