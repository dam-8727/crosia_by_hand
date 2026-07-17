import { useEffect, useState } from 'react';
import { api } from '../../api';
import AdminNav from './AdminNav';
import './Admin.css';

const STATUS_OPTIONS = ['paid', 'shipped', 'delivered', 'cod_pending', 'failed'];

const statusLabels = {
  paid: 'Paid',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cod_pending: 'COD pending',
  failed: 'Failed',
  created: 'Pending',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await api.getAllOrders();
      setOrders(data.orders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function changeStatus(id, status) {
    const data = await api.updateOrderStatus(id, status);
    setOrders((prev) => prev.map((o) => (o._id === id ? data.order : o)));
  }

  if (loading) return (<section className="admin"><AdminNav /><p className="page-status">Loading orders…</p></section>);
  if (error) return (<section className="admin"><AdminNav /><p className="page-status">{error}</p></section>);

  const revenue = orders
    .filter((o) => ['paid', 'shipped', 'delivered'].includes(o.status))
    .reduce((sum, o) => sum + o.amount, 0);

  return (
    <section className="admin">
      <AdminNav />

      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-num">{orders.length}</span>
          <span className="stat-label">Total orders</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">₹{revenue}</span>
          <span className="stat-label">Revenue (paid)</span>
        </div>
      </div>

      <h2 className="admin-list-title">All orders</h2>
      {!orders.length ? (
        <p className="page-status">No orders yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td>
                    <div className="cell-strong">#{o._id.slice(-8)}</div>
                    <div className="cell-sub">
                      {new Date(o.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </div>
                  </td>
                  <td>
                    <div className="cell-strong">{o.user?.name || '—'}</div>
                    <div className="cell-sub">{o.user?.email || ''}</div>
                    <div className="cell-sub">{o.shipping?.city} - {o.shipping?.pincode}</div>
                  </td>
                  <td className="cell-items">
                    {o.items.map((i, idx) => (
                      <div key={idx}>{i.name} × {i.qty}</div>
                    ))}
                  </td>
                  <td>₹{o.amount}</td>
                  <td>{o.paymentMethod === 'cod' ? 'COD' : 'Razorpay'}</td>
                  <td>
                    <select
                      className={`status-select status-${o.status}`}
                      value={STATUS_OPTIONS.includes(o.status) ? o.status : 'paid'}
                      onChange={(e) => changeStatus(o._id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{statusLabels[s]}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
