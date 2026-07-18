import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import StarRating from './StarRating';
import './ProductReviews.css';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ProductReviews({ slug, onRatingChange }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const myReview = user
    ? reviews.find((r) => String(r.user) === String(user._id))
    : null;

  async function loadReviews() {
    try {
      const data = await api.getReviews(slug);
      setReviews(data.reviews);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Pre-fill the form when the user already has a review.
  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment || '');
    } else {
      setRating(0);
      setComment('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myReview?._id]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (rating < 1) {
      setError('Please select a star rating');
      return;
    }
    setSubmitting(true);
    try {
      await api.addReview(slug, { rating, comment: comment.trim() });
      await loadReviews();
      onRatingChange?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete() {
    if (!window.confirm('Delete your review?')) return;
    setSubmitting(true);
    try {
      await api.deleteReview(slug);
      await loadReviews();
      onRatingChange?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const avg =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

  return (
    <section className="reviews">
      <div className="reviews-head">
        <h2>Customer Reviews</h2>
        {reviews.length > 0 && (
          <div className="reviews-summary">
            <StarRating value={avg} size="md" />
            <span className="reviews-avg">{avg.toFixed(1)}</span>
            <span className="reviews-count">
              ({reviews.length} review{reviews.length > 1 ? 's' : ''})
            </span>
          </div>
        )}
      </div>

      {/* Review form / login prompt */}
      {user ? (
        <form className="review-form" onSubmit={onSubmit}>
          <h3>{myReview ? 'Update your review' : 'Write a review'}</h3>
          <div className="review-form-stars">
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>
          <textarea
            placeholder="Share your thoughts about this product (optional)…"
            value={comment}
            maxLength={1000}
            rows={3}
            onChange={(e) => setComment(e.target.value)}
          />
          {error && <p className="form-error">{error}</p>}
          <div className="review-form-actions">
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : myReview ? 'Update review' : 'Submit review'}
            </button>
            {myReview && (
              <button
                className="btn btn-ghost"
                type="button"
                onClick={onDelete}
                disabled={submitting}
              >
                Delete
              </button>
            )}
          </div>
        </form>
      ) : (
        <p className="review-login-prompt">
          <Link to="/login">Log in</Link> to write a review.
        </p>
      )}

      {/* Review list */}
      {loading ? (
        <p className="page-status">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="reviews-empty">No reviews yet. Be the first to review this product!</p>
      ) : (
        <ul className="review-list">
          {reviews.map((r) => (
            <li key={r._id} className="review-item">
              <div className="review-item-head">
                <span className="review-author">{r.name}</span>
                {r.verified && <span className="review-verified">✓ Verified purchase</span>}
              </div>
              <div className="review-item-meta">
                <StarRating value={r.rating} size="sm" />
                <span className="review-date">{formatDate(r.createdAt)}</span>
              </div>
              {r.comment && <p className="review-comment">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
