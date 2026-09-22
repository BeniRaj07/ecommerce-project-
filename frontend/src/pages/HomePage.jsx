import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import API from '../api';
import Product from '../components/Product';
import Loader from '../components/Loader';
import Hero from '../components/Hero';
import ProductCarousel from '../components/ProductCarousel';
import FeaturedCategories from '../components/FeaturedCategories';
import ShopByMaker from '../components/ShopByMaker';
import FilterSidebar from '../components/FilterSidebar';
import {
  footwearCategories,
  categoryBySlug,
  locationBySlug,
  adultSizes,
  kidsSizes,
  filterSizes,
} from '../data/categories';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { keyword, category: categorySlug, location: locationSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryName = categorySlug ? categoryBySlug[categorySlug] : undefined;
  const locationName = locationSlug ? locationBySlug[locationSlug] : undefined;
  const currentCategory = footwearCategories.find((c) => c.slug === categorySlug);

  const isListing = Boolean(keyword || categoryName || locationName);
  const sizeOptions = categoryName === 'Kids' ? kidsSizes : categoryName ? adultSizes : filterSizes;

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const apiParams = {
          ...Object.fromEntries(searchParams.entries()),
        };
        if (keyword) apiParams.keyword = keyword;
        if (categoryName) apiParams.category = categoryName;
        if (locationName) apiParams.location = locationName;

        const { data } = await API.get(`/api/products`, { params: apiParams });
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, categorySlug, locationSlug, searchParams.toString()]);

  let title = 'Our Products';
  if (keyword) title = `Search Results for "${keyword}"`;
  else if (locationName) title = `${locationName} Makers`;
  else if (categoryName) {
    const sub = searchParams.get('sub');
    title = sub ? `${categoryName} — ${sub}` : categoryName;
  }

  const sort = searchParams.get('sort') || '';
  const setSort = (value) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set('sort', value) : next.delete('sort');
    setSearchParams(next);
  };

  const productsSection = (
    <div className={isListing ? '' : 'mt-4'}>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="font-display text-3xl font-bold text-slate-900">{title}</h1>
        {isListing && (
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="border border-slate-200 rounded-lg p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">Sort: Default</option>
            <option value="newest">Newest</option>
            <option value="bestselling">Best Selling</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        )}
      </div>

      <div className={isListing ? 'flex flex-col md:flex-row gap-6' : ''}>
        {isListing && (
          <FilterSidebar
            subCategories={currentCategory ? currentCategory.subCategories : []}
            hideLocation={Boolean(locationName)}
            sizeOptions={sizeOptions}
          />
        )}

        <div className="flex-1">
          {loading ? (
            <Loader />
          ) : products.length === 0 ? (
            <p className="p-10 bg-white rounded-2xl shadow-soft text-center text-slate-500">No footwear matches these filters yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((product) => (
                <div key={product._id}>
                  <Product product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {!isListing ? (
        <>
          <Hero />
          <ProductCarousel />
          {productsSection}
          <FeaturedCategories />
          <ShopByMaker />
        </>
      ) : (
        <>
          <Link to='/' className='inline-flex items-center mb-6 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-lg shadow-soft text-sm transition-colors'>
            &larr; Go Back
          </Link>
          {productsSection}
        </>
      )}
    </>
  );
};

export default HomePage;
