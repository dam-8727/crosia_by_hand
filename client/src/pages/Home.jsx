import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import ProductCard from '../components/ProductCard';
import './Home.css';

const CATEGORIES = ['Decor', 'Storage', 'Living', 'Wear & Carry'];

export default function Home() {
  const { user } = useAuth();
  const location = useLocation();
  const justRegistered = Boolean(location.state?.justRegistered);
  const [featured, setFeatured] = useState([]);
  const [categoryTiles, setCategoryTiles] = useState(
    CATEGORIES.map((name) => ({ name, image: null }))
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.getProducts();
        const products = data.products || [];
        if (cancelled) return;
        setFeatured(products.slice(0, 4));
        setCategoryTiles(
          CATEGORIES.map((name) => ({
            name,
            image: products.find((p) => p.category === name)?.imageUrl ?? null,
          }))
        );
      } catch {
        if (!cancelled) {
          setFeatured([]);
          setCategoryTiles(CATEGORIES.map((name) => ({ name, image: null })));
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <section className="hero-banner">
        <img
          src="/hero-banner.png"
          alt="Crosia by Hand — handmade crochet creations crafted with care"
        />
        <div className="hero-banner-actions">
          <Link to="/shop" className="btn btn-primary">
            Explore collection
          </Link>
          {!user && (
            <Link to="/register" className="btn btn-outline">
              Create account
            </Link>
          )}
        </div>
      </section>

      {user && (
        <p className="welcome-banner">
          {justRegistered ? 'Welcome' : 'Welcome back'}, <strong>{user.name}</strong>.
        </p>
      )}

      <section className="home-section">
        <h2 className="section-title">Shop by category</h2>
        <div className="category-tiles">
          {categoryTiles.map((c) => (
            <Link
              key={c.name}
              to={`/shop?category=${encodeURIComponent(c.name)}`}
              className="category-tile"
            >
              {c.image ? (
                <img src={c.image} alt={c.name} loading="lazy" />
              ) : (
                <div className="category-tile-placeholder" aria-hidden="true" />
              )}
              <span className="category-tile-label">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="home-section">
          <div className="section-head">
            <h2 className="section-title">Featured</h2>
            <Link to="/shop" className="see-all">View all →</Link>
          </div>
          <div className="product-grid">
            {featured.map((p) => (
              <ProductCard key={p._id} product={{ ...p, id: p._id }} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
