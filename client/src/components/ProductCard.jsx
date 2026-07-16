import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { add } = useCart();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

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
      </Link>
      <div className="product-body">
        <span className="product-cat">{product.category}</span>
        <Link to={`/product/${product.slug}`} className="product-name">
          {product.name}
        </Link>
        <div className="product-row">
          <span className="product-price">₹{product.price}</span>
          <button className="btn btn-primary btn-sm" onClick={onAdd} disabled={busy}>
            {busy ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
