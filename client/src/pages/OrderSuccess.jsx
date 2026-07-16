import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import './OrderSuccess.css';

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getOrder(id)
      .then((data) => setOrder(data.order))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="page-status">{error}</p>;
  if (!order) return <p className="page-status">Loading…</p>;

  const isCod = order.paymentMethod === 'cod';

  return (
    <section className="order-success">
      <div className="success-badge">✓</div>
      <h1>Thank you for your order!</h1>
      <p className="success-sub">
        {isCod
          ? 'Your order is confirmed. Pay cash on delivery.'
          : 'Your payment was successful and your order is confirmed.'}
      </p>

      <div className="success-card">
        <div className="success-row">
          <span>Order ID</span>
          <span>{order._id}</span>
        </div>
        <div className="success-row">
          <span>Amount</span>
          <span>₹{order.amount}</span>
        </div>
        <div className="success-row">
          <span>Payment</span>
          <span>{isCod ? 'Cash on Delivery' : 'Razorpay (Paid)'}</span>
        </div>
        <div className="success-row">
          <span>Ship to</span>
          <span>
            {order.shipping.fullName}, {order.shipping.city} - {order.shipping.pincode}
          </span>
        </div>
      </div>

      <div className="success-actions">
        <Link to="/orders" className="btn btn-primary">View my orders</Link>
        <Link to="/shop" className="btn btn-outline">Continue shopping</Link>
      </div>
    </section>
  );
}
