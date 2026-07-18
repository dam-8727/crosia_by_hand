import { useState } from 'react';
import './StarRating.css';

// Display-only stars (supports half-ish via rounding) or interactive picker when onChange is passed.
export default function StarRating({ value = 0, onChange, size = 'md' }) {
  const [hover, setHover] = useState(0);
  const interactive = typeof onChange === 'function';
  const active = hover || value;

  return (
    <div className={`star-rating star-${size} ${interactive ? 'star-interactive' : ''}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = interactive
          ? star <= active
          : star <= Math.round(value);
        const Tag = interactive ? 'button' : 'span';
        return (
          <Tag
            key={star}
            type={interactive ? 'button' : undefined}
            className={`star ${filled ? 'filled' : ''}`}
            onClick={interactive ? () => onChange(star) : undefined}
            onMouseEnter={interactive ? () => setHover(star) : undefined}
            onMouseLeave={interactive ? () => setHover(0) : undefined}
            aria-label={interactive ? `Rate ${star} star${star > 1 ? 's' : ''}` : undefined}
          >
            ★
          </Tag>
        );
      })}
    </div>
  );
}
