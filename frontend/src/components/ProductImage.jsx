import React, { forwardRef } from 'react';

const PLACEHOLDER = '/images/placeholder-shoe.svg';

// Falls back to the standard "photo coming soon" placeholder whenever the
// real image 404s (missing upload, un-supplied traditional-catalog photo,
// etc.) instead of leaving the browser's broken-image icon on screen.
const ProductImage = forwardRef(({ src, alt, className, ...rest }, ref) => (
  <img
    ref={ref}
    src={src || PLACEHOLDER}
    alt={alt}
    className={className}
    onError={(e) => {
      if (e.currentTarget.src.endsWith(PLACEHOLDER)) return;
      e.currentTarget.onerror = null;
      e.currentTarget.src = PLACEHOLDER;
    }}
    {...rest}
  />
));

export default ProductImage;
