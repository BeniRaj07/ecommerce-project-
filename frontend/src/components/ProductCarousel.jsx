import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import API from '../api';
import Loader from './Loader';

const WHEEL_SWIPE_THRESHOLD = 30;
const WHEEL_SWIPE_COOLDOWN = 600;

const ProductCarousel = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef(null);
  const lastWheelSwipeRef = useRef(0);

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const { data: topProducts } = await API.get('/api/products/top');
        setProducts(topProducts.slice(0, 5));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopProducts();
  }, []);

  const handleWheel = (e) => {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY) || Math.abs(e.deltaX) < WHEEL_SWIPE_THRESHOLD) return;

    const now = Date.now();
    if (now - lastWheelSwipeRef.current < WHEEL_SWIPE_COOLDOWN) return;
    lastWheelSwipeRef.current = now;

    if (e.deltaX > 0) {
      carouselRef.current?.increment();
    } else {
      carouselRef.current?.decrement();
    }
  };

  return loading ? <Loader /> : (
    <div className="mb-10 rounded-2xl overflow-hidden shadow-card" onWheel={handleWheel}>
      <Carousel
        ref={carouselRef}
        showThumbs={false}
        autoPlay
        infiniteLoop
        emulateTouch
      >
        {products.map((product) => (
          <div key={product._id} className="relative bg-slate-100">
            <Link to={`/product/${product._id}`}>
              <img src={product.image} alt={product.name} className="h-96 object-contain"/>
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white font-bold text-lg px-4 [text-shadow:0_1px_3px_rgba(0,0,0,0.9),0_0_12px_rgba(0,0,0,0.6)]">
                {product.name} (Rs {product.price}/-)
              </p>
            </Link>
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default ProductCarousel;
