import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import ProductCard from '../components/ProductCard';
import './Shop.css';

const ALL = 'All';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState(searchParams.get('category') || ALL);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function selectCat(cat) {
    setActiveCat(cat);
    if (cat === ALL) {
      setSearchParams({});
    } else {
      setSearchParams({ category: cat });
    }
  }

  useEffect(() => {
    const urlCat = searchParams.get('category') || ALL;
    setActiveCat(urlCat);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await api.getProducts({ category: activeCat, search });
        if (!cancelled) {
          setProducts(data.products);
          setCategories(data.categories || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const t = setTimeout(load, search ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [activeCat, search]);

  return (
    <section className="shop">
      <header className="shop-head">
        <h1>Shop</h1>
        <p className="tagline">Every loop made with love</p>
      </header>

      <div className="shop-controls">
        <div className="cat-filters">
          <button
            className={`chip ${activeCat === ALL ? 'chip-active' : ''}`}
            onClick={() => selectCat(ALL)}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={`chip ${activeCat === c ? 'chip-active' : ''}`}
              onClick={() => selectCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <input
          className="search-input"
          type="search"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <p className="page-status">Loading products…</p>}
      {error && <p className="form-error">{error}</p>}
      {!loading && !error && products.length === 0 && (
        <p className="page-status">No products found.</p>
      )}

      <div className="product-grid">
        {products.map((p) => (
          <ProductCard key={p._id} product={{ ...p, id: p._id }} />
        ))}
      </div>
    </section>
  );
}
