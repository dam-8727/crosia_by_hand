import { NavLink } from 'react-router-dom';

export default function AdminNav() {
  return (
    <div className="admin-head">
      <h1>Admin dashboard</h1>
      <nav className="admin-tabs">
        <NavLink to="/admin/products" className={({ isActive }) => (isActive ? 'active' : '')}>
          Products
        </NavLink>
        <NavLink to="/admin/orders" className={({ isActive }) => (isActive ? 'active' : '')}>
          Orders
        </NavLink>
      </nav>
    </div>
  );
}
