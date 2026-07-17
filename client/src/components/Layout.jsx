import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="site-header">
        <Link to="/" className="brand" onClick={closeMenu}>
          <img src="/logo.png" alt="Crosia by Hand" />
          <span className="brand-text">
            <span className="brand-name">Crosia by Hand</span>
            <span className="brand-tagline">Every loop made with love</span>
          </span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
        </button>

        <nav className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
          <Link to="/" onClick={closeMenu}>Home</Link>
          <Link to="/shop" onClick={closeMenu}>Shop</Link>
          {user ? (
            <>
              <Link to="/cart" className="cart-link" onClick={closeMenu}>
                Cart{cart.count > 0 && <span className="cart-badge">{cart.count}</span>}
              </Link>
              <Link to="/orders" onClick={closeMenu}>Orders</Link>
              {user.role === 'admin' && <Link to="/admin" onClick={closeMenu}>Admin</Link>}
              <span className="nav-hi">Hi, {user.name.split(' ')[0]}</span>
              <button
                type="button"
                className="linkish"
                onClick={() => {
                  closeMenu();
                  logout();
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu}>Log in</Link>
              <Link to="/register" className="btn btn-primary" onClick={closeMenu}>
                Register
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>Crosia by Hand · Every loop made with love</p>
      </footer>
    </>
  );
}
