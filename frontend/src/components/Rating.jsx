import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

const Star = ({ value, position }) => {
  if (value >= position) return <FaStar className="text-amber-400" />;
  if (value >= position - 0.5) return <FaStarHalfAlt className="text-amber-400" />;
  return <FaRegStar className="text-amber-400" />;
};

const Rating = ({ value, text }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((position) => (
        <Star key={position} value={value} position={position} />
      ))}
      {text && <span className="ml-2 text-sm text-slate-500">{text}</span>}
    </div>
  );
};

export default Rating;
