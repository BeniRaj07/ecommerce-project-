import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import API from '../api';
import ProductImage from './ProductImage';

const Hero = () => {
  const [featured, setFeatured] = useState(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await API.get('/api/products/top');
        setFeatured(data[0] || null);
      } catch (error) {
        console.error(error);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="mb-10 rounded-3xl bg-slate-900 overflow-hidden">
      <div className="px-6 sm:px-10 py-14 sm:py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-white leading-[1.05]">
            Find The<br />Perfect Jutta
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-5 max-w-md">
            Handmade, traditional and everyday footwear from local Nepali makers in
            Kathmandu, Lalitpur and Bhaktapur — shop the full collection today.
          </p>
          <div className="flex items-center gap-6 mt-8">
            {featured && (
              <Link
                to={`/product/${featured._id}`}
                className="inline-flex items-center bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-7 rounded-full transition-colors"
              >
                Shop Now
              </Link>
            )}
            <Link to="/category/men" className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 font-semibold text-sm transition-colors">
              Explore More <FaArrowRight />
            </Link>
          </div>
        </div>
        <div className="flex justify-center">
          {featured && (
            <Link to={`/product/${featured._id}`} className="block w-64 sm:w-80">
              <ProductImage
                src={featured.image}
                alt={featured.name}
                className="w-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)] rotate-[-8deg] hover:rotate-0 transition-transform duration-500"
              />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Hero;
