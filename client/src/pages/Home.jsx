import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import ProductCard from '../components/ProductCard';
import './Home.css';

const CATEGORY_TILES = [
  { name: 'Decor', image: '/products/wall_hanging_1.png' },
  { name: 'Storage', image: '/products/basket_2.png' },
  { name: 'Living', image: '/products/sunflower_cushion_cover.jpg' },
  { name: 'Wear & Carry', image: '/products/purse_2.png' },
];

export default function Home() {
  const { user } = useAuth();
  const location = useLocation();
  const justRegistered = Boolean(location.state?.justRegistered);
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.getProducts();
        if (!cancelled) setFeatured((data.products || []).slice(0, 4));
      } catch {
        if (!cancelled) setFeatured([]);
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
          {CATEGORY_TILES.map((c) => (
            <Link
              key={c.name}
              to={`/shop?category=${encodeURIComponent(c.name)}`}
              className="category-tile"
            >
              <img src={c.image} alt={c.name} loading="lazy" />
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
