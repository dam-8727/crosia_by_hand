import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Checkout.css';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, refresh } = useCart();

  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!cart.items.length) {
      navigate('/cart', { replace: true });
    }
  }, [cart.items.length, navigate]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data = await api.createOrder(form);

      // No keys configured -> Cash on Delivery
      if (data.mode === 'cod') {
        await refresh();
        navigate(`/order-success/${data.orderId}`, { replace: true });
        return;
      }

      // Razorpay flow
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Could not load Razorpay. Check your connection.');
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Crosia by Hand',
        description: 'Every loop made with love',
        order_id: data.razorpayOrderId,
        prefill: {
          name: form.fullName,
          email: user?.email || '',
          contact: form.phone,
        },
        theme: { color: '#a9744f' },
        handler: async (response) => {
          try {
            await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            await refresh();
            navigate(`/order-success/${data.orderId}`, { replace: true });
          } catch (err) {
            setError(err.message || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      });

      rzp.on('payment.failed', () => {
        setError('Payment failed. Please try again.');
        setSubmitting(false);
      });

      rzp.open();
    } catch (err) {
      setError(err.message || 'Could not place order');
      setSubmitting(false);
    }
  }

  return (
    <section className="checkout">
      <h1>Checkout</h1>
      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h2>Shipping details</h2>
          {error && <p className="form-error">{error}</p>}

          <label>
            Full name
            <input name="fullName" value={form.fullName} onChange={handleChange} required />
          </label>
          <label>
            Phone
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="10-digit mobile"
              required
            />
          </label>
          <label>
            Address
            <textarea name="address" value={form.address} onChange={handleChange} rows={3} required />
          </label>
          <div className="form-row">
            <label>
              City
              <input name="city" value={form.city} onChange={handleChange} required />
            </label>
            <label>
              Pincode
              <input
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                placeholder="6-digit"
                required
              />
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Processing…' : `Pay ₹${cart.total}`}
          </button>
        </form>

        <aside className="order-summary">
          <h2>Order summary</h2>
          <ul className="summary-items">
            {cart.items.map((item) => (
              <li key={item.product.id}>
                <img src={item.product.imageUrl} alt={item.product.name} />
                <span className="s-name">
                  {item.product.name} <em>× {item.qty}</em>
                </span>
                <span className="s-price">₹{item.lineTotal}</span>
              </li>
            ))}
          </ul>
          <div className="summary-total">
            <span>Total</span>
            <span>₹{cart.total}</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
