import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Cart.css';

export default function Cart() {
  const { cart, loading, update, remove } = useCart();

  if (loading) return <p className="page-status">Loading cart…</p>;

  if (!cart.items.length) {
    return (
      <section className="cart-empty">
        <h1>Your cart</h1>
        <p className="page-status">Your cart is empty.</p>
        <Link to="/shop" className="btn btn-primary">Start shopping</Link>
      </section>
    );
  }

  return (
    <section className="cart">
      <h1>Your cart</h1>
      <div className="cart-list">
        {cart.items.map((item) => (
          <div className="cart-item" key={item.product.id}>
            <img src={item.product.imageUrl} alt={item.product.name} />
            <div className="cart-item-info">
              <Link to={`/product/${item.product.slug}`} className="product-name">
                {item.product.name}
              </Link>
              <span className="product-cat">{item.product.category}</span>
              <span className="cart-price">₹{item.product.price}</span>
            </div>
            <div className="cart-item-actions">
              <div className="qty-stepper">
                <button onClick={() => update(item.product.id, item.qty - 1)}>−</button>
                <span>{item.qty}</span>
                <button onClick={() => update(item.product.id, item.qty + 1)}>+</button>
              </div>
              <span className="line-total">₹{item.lineTotal}</span>
              <button className="linkish remove" onClick={() => remove(item.product.id)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>Items</span>
          <span>{cart.count}</span>
        </div>
        <div className="summary-row total">
          <span>Total</span>
          <span>₹{cart.total}</span>
        </div>
        <Link to="/checkout" className="btn btn-primary checkout-btn">
          Proceed to checkout
        </Link>
      </div>
    </section>
  );
}
