import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import './PaymentPage.css';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderData } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [paymentOption, setPaymentOption] = useState('online');

  // Razorpay key will be provided by backend create-order API

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  useEffect(() => {
    if (!orderData) {
      navigate('/cart');
    }
  }, [orderData, navigate]);

  if (!orderData) {
    return null;
  }

  const handlePayment = async () => {
    if (paymentOption === 'cod') {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: orderData.userId,
            items: orderData.items,
            totalAmount: orderData.total,
            shippingAddress: orderData.shippingAddress,
            paymentMethod: 'cod',
            paymentDetails: { method: 'COD' },
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          navigate('/order-confirmation', {
            state: {
              orderId: data.orderId,
              orderData: orderData,
              paymentMethod: 'cod',
            },
          });
        } else {
          alert(data.message || 'Failed to place order. Please try again.');
        }
      } catch (error) {
        console.error('COD order error:', error);
        alert('Error placing order. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setLoading(false);
      alert('Razorpay SDK failed to load. Check your network.');
      return;
    }

    // Ask backend to create a Razorpay order
    let createOrderRes;
    try {
      createOrderRes = await fetch('http://localhost:5000/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: orderData.total, currency: 'INR' }),
      });
    } catch (e) {
      setLoading(false);
      alert('Unable to reach payment service.');
      return;
    }

    const createOrderData = await createOrderRes.json();
    if (!createOrderData.success) {
      setLoading(false);
      alert(createOrderData.message || 'Failed to initialize payment');
      return;
    }

    const { order, keyId } = createOrderData;

    const options = {
      key: keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'Checkout Payment',
      description: 'Order payment',
      order_id: order.id,
      prefill: {
        name: orderData.shippingAddress.fullName,
        email: orderData.shippingAddress.email,
        contact: orderData.shippingAddress.phone,
      },
      notes: {
        itemsCount: String(orderData.items.length),
      },
      theme: { color: '#3399cc' },
      handler: async function (response) {
        try {
          // Verify payment signature on backend first
          const verifyRes = await fetch('http://localhost:5000/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyData.success) {
            alert('Payment verification failed. Your payment will be reversed if debited.');
            setLoading(false);
            return;
          }

          // Create order in backend after successful verification
          const paymentMethod = 'razorpay';
          const res = await fetch('http://localhost:5000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: orderData.userId,
              items: orderData.items,
              totalAmount: orderData.total,
              shippingAddress: orderData.shippingAddress,
              paymentMethod,
              paymentDetails: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              },
            }),
          });
          const data = await res.json();
          if (data.success) {
            navigate('/order-confirmation', {
              state: {
                orderId: data.orderId,
                orderData: orderData,
                paymentMethod,
              },
            });
          } else {
            alert(data.message || 'Failed to place order after payment');
          }
        } catch (err) {
          console.error('Order creation error after payment:', err);
          alert('Payment succeeded but order placement failed. Contact support.');
        } finally {
          setLoading(false);
        }
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
        },
      },
      method: {
        upi: true,
        card: true,
        netbanking: true,
        wallet: false,
        emi: false,
      },
      config: {
        display: {
          preferences: {
            show_default_blocks: true,
          },
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const payButtonLabel = paymentOption === 'online'
    ? `Pay ₹${Number(orderData.total).toFixed(2)}`
    : 'Place Order (COD)';

  return (
    <>
      <Header />
      <div className="payment-page">
        <div className="payment-container">
          <div className="payment-content">
            {/* Left Side - Payment Information */}
            <div className="payment-methods-section">
              <h2>Select Payment Option</h2>

              <div
                className={`payment-method-card ${paymentOption === 'online' ? 'selected' : ''}`}
                onClick={() => setPaymentOption('online')}
              >
                <div className="method-header">
                  <div className="method-icon">💳</div>
                  <div className="method-info">
                    <h3>Online Payment</h3>
                    <p>UPI, QR, Cards, Netbanking via Razorpay</p>
                  </div>
                </div>
                {paymentOption === 'online' && (
                  <div className="method-details">
                    <p>
                      You will be redirected to the Razorpay window. Choose from UPI, Cards, Netbanking,
                      or QR to complete your payment securely.
                    </p>
                    <ul className="method-list">
                      <li>Instant confirmation after payment</li>
                      <li>Supports all major UPI apps and banks</li>
                      <li>Card payments with OTP verification</li>
                    </ul>
                  </div>
                )}
              </div>

              <div
                className={`payment-method-card ${paymentOption === 'cod' ? 'selected' : ''}`}
                onClick={() => setPaymentOption('cod')}
              >
                <div className="method-header">
                  <div className="method-icon">💵</div>
                  <div className="method-info">
                    <h3>Cash on Delivery</h3>
                    <p>Pay with cash when the order arrives</p>
                  </div>
                </div>
                {paymentOption === 'cod' && (
                  <div className="method-details">
                    <p>
                      Confirm your order now and pay the delivery partner in cash once you receive your package.
                    </p>
                    <ul className="method-list">
                      <li>No online payment required</li>
                      <li>Order will move straight to processing</li>
                      <li>Available for eligible pin codes only</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Order Summary */}
            <div className="order-summary-section">
              <h2>Order Summary</h2>
              
              <div className="summary-card">
                <div className="order-items">
                  <h3>Items ({orderData.items.length})</h3>
                  {orderData.items.map((item, index) => (
                    <div key={index} className="summary-item">
                      <div className="item-details">
                        <span className="item-name">{item.name}</span>
                        <span className="item-quantity">Qty: {item.quantity}</span>
                      </div>
                      <span className="item-price">₹{(Number(item.price) * (Number(item.quantity) || 1)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="price-breakdown">
                  <div className="price-row">
                    <span>Subtotal</span>
                    <span>₹{Number(orderData.subtotal).toFixed(2)}</span>
                  </div>
                  {/* <div className="price-row">
                    <span>GST (18%)</span>
                    <span>₹{orderData.gst.toFixed(2)}</span>
                  </div> */}
                  <div className="price-row total">
                    <span>Total Amount</span>
                    <span>₹{Number(orderData.total).toFixed(2)}</span>
                  </div>
                </div>

                <div className="shipping-address">
                  <h3>Shipping Address</h3>
                  <p>{orderData.shippingAddress.fullName}</p>
                  <p>{orderData.shippingAddress.address}</p>
                  <p>{orderData.shippingAddress.city}, {orderData.shippingAddress.zipCode}</p>
                  <p>📞 {orderData.shippingAddress.phone}</p>
                  <p>✉️ {orderData.shippingAddress.email}</p>
                </div>

                <button 
                  className="pay-now-btn" 
                  onClick={handlePayment}
                  disabled={loading}
                >
                  {loading ? '⏳ Processing...' : `Pay ₹${Number(orderData.total).toFixed(2)}`}
                </button>

                <div className="secure-payment">
                  <span>🔒</span>
                  <p>
                    {paymentOption === 'online'
                      ? 'Secure Payment - Your information is protected'
                      : 'Order now, pay safely on delivery'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentPage;
