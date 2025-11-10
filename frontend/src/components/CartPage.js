import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Header from './Header';
import Footer from './Footer';
import './CartPage.css';

const CartPage = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(productId, parseInt(newQuantity));
  };

  const handleCheckout = () => {
    const user = localStorage.getItem('user');
    if (!user) {
      alert('Please login to proceed to checkout');
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <Header />
        <main className="cart-content">
          <div className="cart-container">
            <h1>Shopping Cart</h1>
            <div className="empty-cart">
              <div className="empty-cart-icon">🛒</div>
              <h2>Your cart is empty</h2>
              <p>Add some products to get started!</p>
              <button className="continue-shopping-btn" onClick={() => navigate('/products')}>
                Continue Shopping
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="cart-page">
      <Header />
      <main className="cart-content">
        <div className="cart-container">
          <div className="cart-header">
            <h1>Shopping Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</h1>
            <button className="clear-cart-btn" onClick={clearCart}>
              Clear Cart
            </button>
          </div>

          <div className="cart-layout">
            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div className="no-image">📦</div>
                    )}
                  </div>

                  <div className="cart-item-details">
                    <h3 className="cart-item-name">{item.name}</h3>
                    <p className="cart-item-description">{item.description}</p>
                    <span className="cart-item-age">{item.age_range}</span>
                  </div>

                  <div className="cart-item-quantity">
                    <label>Quantity:</label>
                    <div className="quantity-controls">
                      <button
                        className="qty-btn"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        min="1"
                        max={item.stock_quantity}
                      />
                      <button
                        className="qty-btn"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock_quantity}
                      >
                        +
                      </button>
                    </div>
                    <span className="stock-info">
                      (Max: {item.stock_quantity})
                    </span>
                  </div>

                  <div className="cart-item-price">
                    <div className="price-label">Price:</div>
                    <div className="unit-price">₹{item.price}</div>
                    <div className="total-price">₹{(item.price * item.quantity).toFixed(2)}</div>
                  </div>

                  <button
                    className="remove-item-btn"
                    onClick={() => removeFromCart(item.id)}
                    title="Remove from cart"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h2>Order Summary</h2>
              
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>₹{getCartTotal().toFixed(2)}</span>
              </div>

              <div className="summary-row">
                <span>Shipping:</span>
                <span className="free">FREE</span>
              </div>

              <div className="summary-row">
                <span>Tax (GST 18%):</span>
                <span>₹{(getCartTotal() * 0.18).toFixed(2)}</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row total">
                <span>Total:</span>
                <span>₹{(getCartTotal() * 1.18).toFixed(2)}</span>
              </div>

              <button className="checkout-btn" onClick={handleCheckout}>
                Proceed to Checkout
              </button>

              <button className="continue-shopping-link" onClick={() => navigate('/products')}>
                ← Continue Shopping
              </button>

              <div className="payment-methods">
                <p>We accept:</p>
                <div className="payment-icons">
                  💳 💵 🏦
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CartPage;
