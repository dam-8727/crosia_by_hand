import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './ProductDetail.css';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { add } = useCart();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await api.getProduct(slug);
        if (!cancelled) setProduct(data.product);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function onAdd() {
    if (!user) {
      navigate('/login');
      return;
    }
    setBusy(true);
    setAdded(false);
    try {
      await add(product._id, qty);
      setAdded(true);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="page-status">Loading…</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!product) return null;

  return (
    <section className="product-detail">
      <div className="detail-media">
        <img src={product.imageUrl} alt={product.name} />
      </div>
      <div className="detail-info">
        <Link to="/shop" className="back-link">← Back to shop</Link>
        <span className="product-cat">{product.category}</span>
        <h1>{product.name}</h1>
        <p className="detail-price">₹{product.price}</p>
        <p className="detail-desc">{product.description}</p>
        <ul className="detail-meta">
          {product.color && <li><strong>Color:</strong> {product.color}</li>}
          <li><strong>Material:</strong> {product.material}</li>
          <li><strong>In stock:</strong> {product.stock}</li>
        </ul>
        <div className="qty-row">
          <label htmlFor="qty">Qty</label>
          <input
            id="qty"
            type="number"
            min="1"
            max={product.stock}
            value={qty}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
          />
          <button className="btn btn-primary" onClick={onAdd} disabled={busy}>
            {busy ? 'Adding…' : 'Add to cart'}
          </button>
        </div>
        {added && (
          <p className="form-success">
            Added to cart. <Link to="/cart">View cart →</Link>
          </p>
        )}
      </div>
    </section>
  );
}
