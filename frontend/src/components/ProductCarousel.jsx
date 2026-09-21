import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import API from '../api';
import Loader from './Loader';

const ProductCarousel = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return loading ? <Loader /> : (
    <Carousel
      showThumbs={false}
      autoPlay
      infiniteLoop
      className="mb-8"
    >
      {products.map((product) => (
        <div key={product._id} className="relative">
          <Link to={`/product/${product._id}`}>
            <img src={product.image} alt={product.name} className="h-96 object-contain"/>
            <p className="legend">{product.name} (Rs {product.price}/-)</p>
          </Link>
        </div>
      ))}
    </Carousel>
  );
};

export default ProductCarousel;
