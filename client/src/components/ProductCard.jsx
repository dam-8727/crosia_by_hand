import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import StarRating from './StarRating';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { add } = useCart();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 3;

  async function onAdd() {
    if (!user) {
      navigate('/login');
      return;
    }
    setBusy(true);
    try {
      await add(product.id, 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="product-card">
      <Link to={`/product/${product.slug}`} className="product-media">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        {outOfStock ? (
          <span className="stock-badge out">Out of stock</span>
        ) : lowStock ? (
          <span className="stock-badge low">Only {product.stock} left</span>
        ) : null}
      </Link>
      <div className="product-body">
        <span className="product-cat">{product.category}</span>
        <Link to={`/product/${product.slug}`} className="product-name">
          {product.name}
        </Link>
        {product.numReviews > 0 ? (
          <div className="product-rating">
            <StarRating value={product.rating} size="sm" />
            <span className="rating-count">({product.numReviews})</span>
          </div>
        ) : (
          <div className="product-rating product-rating-empty">No reviews yet</div>
        )}
        <div className="product-row">
          <span className="product-price">₹{product.price}</span>
          <button
            className="btn btn-primary btn-sm"
            onClick={onAdd}
            disabled={busy || outOfStock}
          >
            {outOfStock ? 'Sold out' : busy ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
