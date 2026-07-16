import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const { cart } = useCart();

  return (
    <>
      <header className="site-header">
        <Link to="/" className="brand">
          <img src="/logo.png" alt="Crosia by Hand" />
          <span className="brand-text">
            <span className="brand-name">Crosia by Hand</span>
            <span className="brand-tagline">Every loop made with love</span>
          </span>
        </Link>
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          {user ? (
            <>
              <Link to="/cart" className="cart-link">
                Cart{cart.count > 0 && <span className="cart-badge">{cart.count}</span>}
              </Link>
              <span className="nav-hi">Hi, {user.name.split(' ')[0]}</span>
              <button type="button" className="linkish" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register" className="btn btn-primary">
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
