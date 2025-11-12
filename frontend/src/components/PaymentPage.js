import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import './PaymentPage.css';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderData } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Card payment fields
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });

  // UPI fields
  const [upiId, setUpiId] = useState('');

  // Net Banking
  const [selectedBank, setSelectedBank] = useState('');

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

  const handleCardInputChange = (e) => {
    let { name, value } = e.target;

    // Format card number with spaces
    if (name === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (value.length > 19) value = value.substr(0, 19);
    }

    // Limit CVV to 3-4 digits
    if (name === 'cvv') {
      value = value.replace(/\D/g, '').substr(0, 4);
    }

    // Format card name (uppercase)
    if (name === 'cardName') {
      value = value.toUpperCase();
    }

    setCardDetails({
      ...cardDetails,
      [name]: value
    });
  };

  const handlePayment = async () => {
    // Validate payment method
    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    // Validate based on payment method
    if (paymentMethod === 'card') {
      if (!cardDetails.cardNumber || !cardDetails.cardName || 
          !cardDetails.expiryMonth || !cardDetails.expiryYear || !cardDetails.cvv) {
        alert('Please fill in all card details');
        return;
      }
      if (cardDetails.cardNumber.replace(/\s/g, '').length !== 16) {
        alert('Please enter a valid 16-digit card number');
        return;
      }
      if (cardDetails.cvv.length < 3) {
        alert('Please enter a valid CVV');
        return;
      }
    }

    if (paymentMethod === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        alert('Please enter a valid UPI ID (e.g., username@bank)');
        return;
      }
    }

    if (paymentMethod === 'netbanking') {
      if (!selectedBank) {
        alert('Please select a bank');
        return;
      }
    }

    // For online methods, use Razorpay Checkout
    if (paymentMethod === 'card' || paymentMethod === 'upi' || paymentMethod === 'netbanking') {
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
            const res = await fetch('http://localhost:5000/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: orderData.userId,
                items: orderData.items,
                totalAmount: orderData.total,
                shippingAddress: orderData.shippingAddress,
                paymentMethod: paymentMethod,
                paymentDetails: {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  upiId: paymentMethod === 'upi' ? upiId : undefined,
                  bank: paymentMethod === 'netbanking' ? selectedBank : undefined,
                  last4:
                    paymentMethod === 'card'
                      ? cardDetails.cardNumber.replace(/\s/g, '').slice(-4)
                      : undefined,
                },
              }),
            });
            const data = await res.json();
            if (data.success) {
              navigate('/order-confirmation', {
                state: {
                  orderId: data.orderId,
                  orderData: orderData,
                  paymentMethod: paymentMethod,
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
          upi: paymentMethod === 'upi',
          netbanking: paymentMethod === 'netbanking',
          card: paymentMethod === 'card',
          wallet: false,
          emi: false,
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      return;
    }

    // COD flow - directly create order
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
          paymentMethod: paymentMethod,
          paymentDetails: { method: 'COD' },
        }),
      });
      const data = await response.json();
      if (data.success) {
        navigate('/order-confirmation', {
          state: {
            orderId: data.orderId,
            orderData: orderData,
            paymentMethod: paymentMethod,
          },
        });
      } else {
        alert(data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order error:', error);
      alert('Error placing order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const banks = [
    'State Bank of India',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Kotak Mahindra Bank',
    'Punjab National Bank',
    'Bank of Baroda',
    'Canara Bank',
    'Union Bank of India',
    'IndusInd Bank'
  ];

  return (
    <>
      <Header />
      <div className="payment-page">
        <div className="payment-container">
          <div className="payment-content">
            {/* Left Side - Payment Methods */}
            <div className="payment-methods-section">
              <h2>Select Payment Method</h2>

              {/* UPI Payment */}
              <div 
                className={`payment-method-card ${paymentMethod === 'upi' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('upi')}
              >
                <div className="method-header">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="method-icon">📱</div>
                  <div className="method-info">
                    <h3>UPI</h3>
                    <p>Pay using UPI ID</p>
                  </div>
                </div>
                {paymentMethod === 'upi' && (
                  <div className="method-details">
                    <div className="form-group">
                      <label htmlFor="upiId">Enter UPI ID</label>
                      <input
                        type="text"
                        id="upiId"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="username@paytm / username@ybl"
                      />
                    </div>
                    <div className="upi-apps">
                      <p>Supported UPI Apps:</p>
                      <div className="upi-logos">
                        <span>Google Pay</span>
                        <span>PhonePe</span>
                        <span>Paytm</span>
                        <span>BHIM</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Credit/Debit Card */}
              <div 
                className={`payment-method-card ${paymentMethod === 'card' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <div className="method-header">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="method-icon">💳</div>
                  <div className="method-info">
                    <h3>Credit / Debit Card</h3>
                    <p>Visa, MasterCard, RuPay</p>
                  </div>
                </div>
                {paymentMethod === 'card' && (
                  <div className="method-details">
                    <div className="form-group">
                      <label htmlFor="cardNumber">Card Number</label>
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        value={cardDetails.cardNumber}
                        onChange={handleCardInputChange}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="cardName">Cardholder Name</label>
                      <input
                        type="text"
                        id="cardName"
                        name="cardName"
                        value={cardDetails.cardName}
                        onChange={handleCardInputChange}
                        placeholder="Name on card"
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Expiry Date</label>
                        <div className="expiry-inputs">
                          <select
                            name="expiryMonth"
                            value={cardDetails.expiryMonth}
                            onChange={handleCardInputChange}
                          >
                            <option value="">MM</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                              <option key={month} value={month.toString().padStart(2, '0')}>
                                {month.toString().padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                          <select
                            name="expiryYear"
                            value={cardDetails.expiryYear}
                            onChange={handleCardInputChange}
                          >
                            <option value="">YYYY</option>
                            {Array.from({ length: 15 }, (_, i) => 2025 + i).map(year => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="cvv">CVV</label>
                        <input
                          type="password"
                          id="cvv"
                          name="cvv"
                          value={cardDetails.cvv}
                          onChange={handleCardInputChange}
                          placeholder="123"
                          maxLength="4"
                        />
                      </div>
                    </div>
                    <div className="card-logos">
                      <span>💳 Visa</span>
                      <span>💳 MasterCard</span>
                      <span>💳 RuPay</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Net Banking */}
              <div 
                className={`payment-method-card ${paymentMethod === 'netbanking' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('netbanking')}
              >
                <div className="method-header">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="netbanking"
                    checked={paymentMethod === 'netbanking'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="method-icon">🏦</div>
                  <div className="method-info">
                    <h3>Net Banking</h3>
                    <p>Pay via Internet Banking</p>
                  </div>
                </div>
                {paymentMethod === 'netbanking' && (
                  <div className="method-details">
                    <div className="form-group">
                      <label htmlFor="bank">Select Your Bank</label>
                      <select
                        id="bank"
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                      >
                        <option value="">-- Choose Bank --</option>
                        {banks.map(bank => (
                          <option key={bank} value={bank}>{bank}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Cash on Delivery */}
              <div 
                className={`payment-method-card ${paymentMethod === 'cod' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('cod')}
              >
                <div className="method-header">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="method-icon">💵</div>
                  <div className="method-info">
                    <h3>Cash on Delivery</h3>
                    <p>Pay when you receive</p>
                  </div>
                </div>
                {paymentMethod === 'cod' && (
                  <div className="method-details">
                    <div className="cod-info">
                      <p>✓ Pay with cash when your order is delivered</p>
                      <p>✓ No extra charges</p>
                    </div>
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
                  disabled={loading || !paymentMethod}
                >
                  {loading ? '⏳ Processing...' : `Pay ₹${Number(orderData.total).toFixed(2)}`}
                </button>

                <div className="secure-payment">
                  <span>🔒</span>
                  <p>Secure Payment - Your information is protected</p>
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
