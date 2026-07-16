import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import './Orders.css';

const statusLabels = {
  paid: 'Paid',
  cod_pending: 'COD',
  created: 'Pending',
  failed: 'Failed',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getOrders()
      .then((data) => setOrders(data.orders))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="page-status">Loading orders…</p>;
  if (error) return <p className="page-status">{error}</p>;

  if (!orders.length) {
    return (
      <section className="orders-empty">
        <h1>My orders</h1>
        <p className="page-status">You haven't placed any orders yet.</p>
        <Link to="/shop" className="btn btn-primary">Start shopping</Link>
      </section>
    );
  }

  return (
    <section className="orders">
      <h1>My orders</h1>
      <div className="orders-list">
        {orders.map((order) => (
          <article className="order-card" key={order._id}>
            <header className="order-card-head">
              <div>
                <span className="order-id">#{order._id.slice(-8)}</span>
                <span className="order-date">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <span className={`order-status status-${order.status}`}>
                {statusLabels[order.status] || order.status}
              </span>
            </header>

            <ul className="order-items">
              {order.items.map((item, idx) => (
                <li key={idx}>
                  <img src={item.imageUrl} alt={item.name} />
                  <span className="oi-name">
                    {item.name} <em>× {item.qty}</em>
                  </span>
                  <span className="oi-price">₹{item.price * item.qty}</span>
                </li>
              ))}
            </ul>

            <footer className="order-card-foot">
              <span>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'}</span>
              <span className="order-total">Total: ₹{order.amount}</span>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
