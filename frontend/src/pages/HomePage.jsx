import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import API from '../api';
import Product from '../components/Product';
import Loader from '../components/Loader';
import ProductCarousel from '../components/ProductCarousel';
import FeaturedCategories from '../components/FeaturedCategories';
import ShopByMaker from '../components/ShopByMaker';
import FilterSidebar from '../components/FilterSidebar';
import {
  footwearCategories,
  categoryBySlug,
  locationBySlug,
  collectionBySlug,
  collections,
} from '../data/categories';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { keyword, category: categorySlug, location: locationSlug, collection: collectionSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryName = categorySlug ? categoryBySlug[categorySlug] : undefined;
  const locationName = locationSlug ? locationBySlug[locationSlug] : undefined;
  const collectionData = collectionSlug ? collectionBySlug[collectionSlug] : undefined;
  const currentCategory = footwearCategories.find((c) => c.slug === categorySlug);

  const isListing = Boolean(keyword || categoryName || locationName || collectionData);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const apiParams = {
          ...(collectionData?.params || {}),
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
  }, [keyword, categorySlug, locationSlug, collectionSlug, searchParams.toString()]);

  let title = 'Latest Footwear';
  if (keyword) title = `Search Results for "${keyword}"`;
  else if (collectionData) title = collectionData.label;
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

  return (
    <>
      {!isListing ? (
        <>
          <ProductCarousel />
          <FeaturedCategories />
          <ShopByMaker />
          <section className="py-8 bg-white border-t">
            <div className="container mx-auto px-4">
              <h2 className="text-xl font-bold mb-4 text-center">Featured Local Collections</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {collections.map((c) => (
                  <Link
                    key={c.slug}
                    to={`/collections/${c.slug}`}
                    className="bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 font-semibold text-sm py-2 px-4 rounded-full"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        <Link to='/' className='inline-block mb-4 bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded'>
          Go Back
        </Link>
      )}

      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          {isListing && (
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="border rounded p-2 text-sm">
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
            />
          )}

          <div className="flex-1">
            {loading ? (
              <Loader />
            ) : products.length === 0 ? (
              <p className="p-6 bg-gray-100 rounded text-center text-gray-600">No footwear matches these filters yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
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
    </>
  );
};

export default HomePage;
