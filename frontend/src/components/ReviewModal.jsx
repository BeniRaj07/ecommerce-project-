import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';

const ReviewModal = ({ item, submitting = false, onSubmit, onMaybeLater }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const canSubmit = rating > 0 && comment.trim().length > 0 && !submitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-sm p-6 text-center">
        <h2 className="text-lg font-bold text-slate-900 mb-4">How was your purchase?</h2>

        <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-xl mx-auto mb-2" />
        <p className="font-semibold text-slate-800 mb-4">{item.name}</p>

        <p className="text-sm font-semibold text-slate-600 mb-2">Your Rating</p>
        <div className="flex justify-center gap-1.5 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-2xl leading-none"
            >
              <FaStar className={(hoverRating || rating) >= star ? 'text-amber-400' : 'text-slate-200'} />
            </button>
          ))}
        </div>

        <label className="block text-sm font-semibold text-slate-600 mb-1.5 text-left">Write your review</label>
        <textarea
          rows="3"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell others what you thought..."
          className="w-full border border-slate-200 rounded-lg py-2.5 px-3 mb-5 outline-none focus:ring-2 focus:ring-brand-500"
        />

        <div className="flex gap-3">
          <button onClick={onMaybeLater} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg transition-colors">
            Maybe Later
          </button>
          <button
            onClick={() => onSubmit({ rating, comment })}
            disabled={!canSubmit}
            className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
