import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import API from '../api';
import { addToCart } from '../store/slices/cartSlice';
import Rating from '../components/Rating';
import Loader from '../components/Loader';
import ProductImage from '../components/ProductImage';
import { toast } from 'react-toastify';
import { slugify } from '../data/categories';

// Clones the product image and animates it flying from its on-page position
// into the header cart icon, giving "Add to Cart" a visible destination
// instead of silently redirecting the shopper away.
const flyToCart = (imgEl) => {
  const cartEl = document.getElementById('cart-icon');
  if (!imgEl || !cartEl) return;

  const imgRect = imgEl.getBoundingClientRect();
  const cartRect = cartEl.getBoundingClientRect();

  const clone = imgEl.cloneNode(true);
  Object.assign(clone.style, {
    position: 'fixed',
    top: `${imgRect.top}px`,
    left: `${imgRect.left}px`,
    width: `${imgRect.width}px`,
    height: `${imgRect.height}px`,
    borderRadius: '1rem',
    zIndex: 9999,
    pointerEvents: 'none',
    transition: 'transform 0.7s cubic-bezier(0.5, -0.3, 0.7, 1.1), opacity 0.7s ease, border-radius 0.7s ease',
  });
  document.body.appendChild(clone);

  const deltaX = cartRect.left + cartRect.width / 2 - (imgRect.left + imgRect.width / 2);
  const deltaY = cartRect.top + cartRect.height / 2 - (imgRect.top + imgRect.height / 2);

  requestAnimationFrame(() => {
    clone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.08)`;
    clone.style.opacity = '0.3';
    clone.style.borderRadius = '50%';
  });

  clone.addEventListener(
    'transitionend',
    () => {
      clone.remove();
      cartEl.classList.add('animate-cart-bump');
      setTimeout(() => cartEl.classList.remove('animate-cart-bump'), 400);
    },
    { once: true }
  );
};

const ProductPage = () => {
  const [product, setProduct] = useState({ reviews: [] });
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [canReview, setCanReview] = useState(false);
  const [reviewCheckDone, setReviewCheckDone] = useState(false);
  const [reviewOrderId, setReviewOrderId] = useState(null);
  const imgRef = useRef(null);

  const { id: productId } = useParams();
  const dispatch = useDispatch();

  const { userInfo } = useSelector((state) => state.auth);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/api/products/${productId}`);
      setProduct(data);
      setSelectedSize(data.sizes?.[0] ?? null);
      setSelectedColor(data.colors?.[0] ?? null);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    const checkReviewEligibility = async () => {
      if (!userInfo) {
        setCanReview(false);
        setReviewCheckDone(true);
        return;
      }
      try {
        const { data } = await API.get('/api/orders/myorders');
        const eligibleOrder = data.find(
          (order) =>
            order.orderStatus === 'delivered' &&
            order.orderItems.some((item) => item.product === productId && !item.reviewed)
        );
        setCanReview(Boolean(eligibleOrder));
        setReviewOrderId(eligibleOrder?._id || null);
      } catch {
        setCanReview(false);
      } finally {
        setReviewCheckDone(true);
      }
    };
    checkReviewEligibility();
  }, [productId, userInfo]);

  const addToCartHandler = () => {
    dispatch(addToCart({ ...product, qty, selectedSize, selectedColor }));
    flyToCart(imgRef.current);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/api/products/${productId}/reviews`, { rating, comment, orderId: reviewOrderId });
      toast.success('Review Submitted!');
      setRating(0);
      setComment('');
      fetchProduct();
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  return loading ? (
    <Loader />
  ) : (
    <>
      <Link to='/' className='inline-flex items-center mb-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-lg shadow-soft text-sm transition-colors'>
        &larr; Go Back
      </Link>

      {product.mainCategory && (
        <p className="text-sm text-slate-400 mb-5">
          <Link to={`/category/${slugify(product.mainCategory)}`} className="hover:text-brand-600 transition-colors">
            {product.mainCategory}
          </Link>
          {' / '}
          {product.subCategory}
        </p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <ProductImage ref={imgRef} src={product.image} alt={product.name} className="w-full rounded-2xl shadow-soft" />
        </div>

        <div className="md:col-span-1 lg:col-span-1">
          <div className="flex flex-wrap gap-2 mb-3">
            {product.isHandmade && (
              <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded-full">Handmade</span>
            )}
            {product.madeInNepal && (
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full">Made in Nepal</span>
            )}
            {product.stockType && (
              <span className="text-xs bg-brand-100 text-brand-700 font-semibold px-2.5 py-1 rounded-full">{product.stockType}</span>
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2 text-slate-900">{product.name}</h1>
          <div className="text-lg mb-4 border-b border-slate-100 pb-4">
            <Rating value={product.rating} text={`${product.numReviews} reviews`} />
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-4">Rs {product.price}/-</p>
          <p className="leading-relaxed text-slate-600 mb-4">{product.description}</p>

          {product.material && (
            <p className="mb-3 text-sm text-slate-600"><strong className="text-slate-800">Material:</strong> {product.material}</p>
          )}

          {product.sizes?.length > 0 && (
            <div className="mb-4">
              <strong className="block mb-2 text-sm text-slate-800">Size</strong>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`w-10 h-10 text-sm rounded-lg border font-medium transition-colors ${selectedSize === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors?.length > 0 && (
            <div className="mb-4">
              <strong className="block mb-2 text-sm text-slate-800">Color</strong>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`text-sm px-3.5 py-1.5 rounded-lg border font-medium transition-colors ${selectedColor === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.maker?.name && (
            <p className="text-sm text-slate-500 mt-5 border-t border-slate-100 pt-4">
              Sold by <strong className="text-slate-700">{product.maker.name}</strong> · {product.maker.location}
            </p>
          )}
        </div>

        <div className="md:col-span-2 lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-soft p-5">
            <div className="flex justify-between py-2.5 border-b border-slate-100 text-sm">
              <span className="text-slate-500">Price</span>
              <strong className="text-slate-900">Rs {product.price}/-</strong>
            </div>
            <div className="flex justify-between py-2.5 border-b border-slate-100 text-sm">
              <span className="text-slate-500">Status</span>
              <strong className={product.countInStock > 0 ? 'text-emerald-600' : 'text-red-500'}>
                {product.countInStock > 0 ? 'In Stock' : 'Out Of Stock'}
              </strong>
            </div>
            {product.countInStock > 0 && (
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100 text-sm">
                <span className="text-slate-500">Qty</span>
                <select value={qty} onChange={(e) => setQty(Number(e.target.value))} className="p-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500">
                  {[...Array(product.countInStock).keys()].map((x) => (
                    <option key={x + 1} value={x + 1}>{x + 1}</option>
                  ))}
                </select>
              </div>
            )}
            <button
              className="w-full bg-brand-600 text-white py-2.5 mt-4 rounded-lg font-semibold hover:bg-brand-700 disabled:bg-slate-300 transition-colors"
              disabled={product.countInStock === 0}
              onClick={addToCartHandler}
            >
              Add To Cart
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-14">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Reviews</h2>
        {product.reviews.length === 0 && <p className="p-5 bg-white rounded-2xl shadow-soft text-slate-500">No Reviews</p>}
        <div className="space-y-3">
          {product.reviews.map((review) => (
            <div key={review._id} className="p-4 bg-white rounded-2xl shadow-soft">
              <strong className="font-semibold text-slate-800">{review.name}</strong>
              <Rating value={review.rating} />
              <p className="text-xs text-slate-400 mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
              <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Write a Customer Review</h2>
          {!userInfo ? (
            <p className="p-4 bg-brand-50 rounded-2xl text-slate-700">
              Please <Link to="/login" className="text-brand-600 hover:underline font-semibold">sign in</Link> to write a review.
            </p>
          ) : !reviewCheckDone ? null : product.reviews.some((r) => r.user === userInfo._id) ? (
            <p className="p-4 bg-brand-50 rounded-2xl text-slate-700">You've already reviewed this product.</p>
          ) : canReview ? (
            <form onSubmit={submitHandler} className="bg-white rounded-2xl shadow-soft p-5 max-w-lg">
              <div className="mb-4">
                <label className="block text-slate-600 text-sm font-semibold mb-1.5">Rating</label>
                <select required value={rating} onChange={(e) => setRating(Number(e.target.value))} className="p-2 border border-slate-200 rounded-lg w-full outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Select...</option>
                  <option value="1">1 - Poor</option>
                  <option value="2">2 - Fair</option>
                  <option value="3">3 - Good</option>
                  <option value="4">4 - Very Good</option>
                  <option value="5">5 - Excellent</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-slate-600 text-sm font-semibold mb-1.5">Comment</label>
                <textarea required rows="3" value={comment} onChange={(e) => setComment(e.target.value)} className="p-2 border border-slate-200 rounded-lg w-full outline-none focus:ring-2 focus:ring-brand-500"></textarea>
              </div>
              <button type="submit" className="bg-brand-600 text-white py-2 px-5 rounded-lg font-semibold hover:bg-brand-700 transition-colors">Submit</button>
            </form>
          ) : (
            <p className="p-4 bg-brand-50 rounded-2xl text-slate-700">
              You can write a review once this product has been delivered to you.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductPage;
