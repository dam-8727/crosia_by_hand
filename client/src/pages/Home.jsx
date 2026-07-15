import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const location = useLocation();
  const justRegistered = Boolean(location.state?.justRegistered);

  return (
    <section className="hero">
      <img className="hero-logo" src="/logo.png" alt="Crosia by Hand logo" />
      <h1>Crosia by Hand</h1>
      <p className="tagline">Every loop made with love</p>
      <div className="divider" aria-hidden="true" />
      <p className="hero-copy">
        Handmade woollen crochet — scarves, caps, sweaters, blankets, and yarn kits.
        Shop soft loops crafted for everyday warmth.
      </p>
      <div className="hero-actions">
        {user ? (
          <p className="welcome-banner">
            {justRegistered ? 'Welcome' : 'Welcome back'}, <strong>{user.name}</strong>.
            Catalog arrives next.
          </p>
        ) : (
          <>
            <Link to="/register" className="btn btn-primary">
              Create account
            </Link>
            <Link to="/login" className="btn btn-outline">
              Log in
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
