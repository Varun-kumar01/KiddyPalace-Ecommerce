import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import './OrdersPage.css';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
});

const statusLabels = {
  pending: 'Pending',
  processing: 'Processing',
  accepted: 'Accepted',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const OrdersPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [addressEditOrderId, setAddressEditOrderId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [trackingByItem, setTrackingByItem] = useState({}); // key: `${orderId}-${itemId}` -> { open, loading, error, data }

  useEffect(() => {
    let isMounted = true;
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      navigate('/login');
      return undefined;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    const loadOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`http://localhost:5000/api/orders/user/${parsedUser.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load orders');
        }

        if (isMounted) {
          setOrders(Array.isArray(data.orders) ? data.orders : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to fetch orders right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const refreshOrders = async () => {
    if (!user) return;

    try {
      const response = await fetch(`http://localhost:5000/api/orders/user/${user.id}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to refresh orders');
      }
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      setError(err.message || 'Unable to refresh orders right now.');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!user) return;
    const confirmCancel = window.confirm('Are you sure you want to cancel this order?');
    if (!confirmCancel) return;

    setActionLoadingId(orderId);
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel order');
      }

      await refreshOrders();
    } catch (err) {
      alert(err.message || 'Could not cancel the order. Please try again later.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenAddressForm = (order) => {
    setAddressEditOrderId(order.id);
    setAddressForm({
      fullName: order.shipping_full_name || '',
      email: order.shipping_email || '',
      phone: order.shipping_phone || '',
      address: order.shipping_address || '',
      city: order.shipping_city || '',
      state: order.shipping_state || '',
      zipCode: order.shipping_zip_code || '',
      country: order.shipping_country || 'India',
    });
  };

  const handleAddressInputChange = (event) => {
    const { name, value } = event.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressSubmit = async (event) => {
    event.preventDefault();
    if (!user || !addressEditOrderId) return;

    setSavingAddress(true);
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${addressEditOrderId}/address`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          shippingAddress: addressForm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update address');
      }

      await refreshOrders();
      setAddressEditOrderId(null);
    } catch (err) {
      alert(err.message || 'Could not update the address. Please try again later.');
    } finally {
      setSavingAddress(false);
    }
  };

  const closeAddressForm = () => {
    setAddressEditOrderId(null);
  };

  const toggleTracking = async (orderId, item) => {
    const key = `${orderId}-${item.id}`;
    const existing = trackingByItem[key];

    // Toggle close if already open and loaded
    if (existing?.open && !existing.loading) {
      setTrackingByItem(prev => ({
        ...prev,
        [key]: { ...existing, open: false }
      }));
      return;
    }

    // If we have data but closed, just open without refetch
    if (existing && existing.data && !existing.open) {
      setTrackingByItem(prev => ({
        ...prev,
        [key]: { ...existing, open: true }
      }));
      return;
    }

    // Fetch fresh
    setTrackingByItem(prev => ({
      ...prev,
      [key]: { open: true, loading: true, error: '', data: null }
    }));

    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/items/${item.id}/tracking`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch tracking');
      }
      setTrackingByItem(prev => ({
        ...prev,
        [key]: { open: true, loading: false, error: '', data: data.tracking }
      }));
    } catch (err) {
      setTrackingByItem(prev => ({
        ...prev,
        [key]: { open: true, loading: false, error: err.message || 'Unable to load tracking', data: null }
      }));
    }
  };

  const groupedOrders = useMemo(() => {
    const completed = [];
    const active = [];

    orders.forEach((order) => {
      if (order.order_status === 'delivered' || order.order_status === 'cancelled') {
        completed.push(order);
      } else {
        active.push(order);
      }
    });

    return { active, completed };
  }, [orders]);

  const renderOrderCard = (order) => {
    const orderDate = order.created_at
      ? new Date(order.created_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'Unknown date';

    const statusLabel = statusLabels[order.order_status] || order.order_status;

    return (
      <div className="order-card" key={order.id}>
        <div className="order-card-header">
          <div>
            <div className="order-number">Order #{order.order_number}</div>
            <div className="order-date">Placed on {orderDate}</div>
          </div>
          <div className={`order-status status-${order.order_status || 'pending'}`}>
            {statusLabel}
          </div>
        </div>

        <div className="order-summary">
          <div>
            <span className="summary-label">Total:</span>
            <span>{currencyFormatter.format(Number(order.total_amount) || 0)}</span>
          </div>
          <div>
            <span className="summary-label">Payment:</span>
            <span className="summary-pill">{(order.payment_method || '').toUpperCase()}</span>
          </div>
          <div>
            <span className="summary-label">Status:</span>
            <span className="summary-pill light">{(order.payment_status || 'pending').toUpperCase()}</span>
          </div>
        </div>

        <div className="order-items">
          {Array.isArray(order.items) && order.items.length > 0 ? (
            order.items.map((item) => (
              <div className="order-item" key={`${order.id}-${item.id}`}>
                <div className="item-name">{item.product_name}</div>
                <div className="item-meta">
                  <span>Qty: {item.quantity}</span>
                  <span>{currencyFormatter.format(Number(item.item_total) || 0)}</span>
                </div>
                <div>
                  <button
                    className="order-action-btn secondary"
                    onClick={() => toggleTracking(order.id, item)}
                  >
                    Track
                  </button>
                </div>

                {/* Inline tracking area */}
                {(() => {
                  const key = `${order.id}-${item.id}`;
                  const t = trackingByItem[key];
                  if (!t?.open) return null;
                  return (
                    <div className="item-tracking" style={{ marginTop: '10px', background: '#fafafa', border: '1px solid #eee', borderRadius: '8px', padding: '12px' }}>
                      {t.loading && <div>Loading tracking...</div>}
                      {t.error && !t.loading && <div className="orders-error">{t.error}</div>}
                      {!t.loading && !t.error && t.data && (
                        <div>
                          <div style={{ marginBottom: '8px' }}>
                            <div><strong>Status:</strong> {statusLabels[t.data.status] || t.data.status}</div>
                            {t.data.trackingNumber && (
                              <div><strong>Tracking #:</strong> {t.data.trackingNumber}</div>
                            )}
                            {t.data.carrier && (
                              <div><strong>Carrier:</strong> {t.data.carrier}</div>
                            )}
                          </div>

                          {/* If cancelled, show single line */}
                          {t.data.status === 'cancelled' ? (
                            <div className="timeline">
                              <div className="timeline-item completed">
                                <div className="timeline-dot"></div>
                                <div className="timeline-content">
                                  <h4>Order Cancelled</h4>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="timeline">
                              {Array.isArray(t.data.timeline) && t.data.timeline.map(step => (
                                <div key={step.key} className={`timeline-item ${step.completed ? 'completed' : ''}`}>
                                  <div className="timeline-dot"></div>
                                  <div className="timeline-content">
                                    <h4>{step.label}</h4>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ))
          ) : (
            <div className="order-empty">No items found for this order.</div>
          )}
        </div>

        <div className="shipping-details">
          <h4>Shipping Address</h4>
          <p>{order.shipping_full_name}</p>
          <p>{order.shipping_address}</p>
          <p>
            {order.shipping_city}, {order.shipping_state} {order.shipping_zip_code}
          </p>
          <p>{order.shipping_country}</p>
          <p>📞 {order.shipping_phone}</p>
          <p>✉️ {order.shipping_email}</p>
        </div>

        <div className="order-actions">
          {order.isCancelable && (
            <button
              className="order-action-btn cancel"
              onClick={() => handleCancelOrder(order.id)}
              disabled={actionLoadingId === order.id}
            >
              {actionLoadingId === order.id ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}

          {order.canUpdateAddress && (
            <button
              className="order-action-btn secondary"
              onClick={() => handleOpenAddressForm(order)}
            >
              Change Address
            </button>
          )}
        </div>

        {addressEditOrderId === order.id && (
          <form className="address-form" onSubmit={handleAddressSubmit}>
            <div className="form-row">
              <label>
                Full Name
                <input
                  type="text"
                  name="fullName"
                  value={addressForm.fullName}
                  onChange={handleAddressInputChange}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={addressForm.email}
                  onChange={handleAddressInputChange}
                  required
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Phone
                <input
                  type="tel"
                  name="phone"
                  value={addressForm.phone}
                  onChange={handleAddressInputChange}
                  required
                />
              </label>
              <label>
                Pincode
                <input
                  type="text"
                  name="zipCode"
                  value={addressForm.zipCode}
                  onChange={handleAddressInputChange}
                  required
                />
              </label>
            </div>

            <label>
              Address
              <textarea
                name="address"
                value={addressForm.address}
                onChange={handleAddressInputChange}
                rows={3}
                required
              />
            </label>

            <div className="form-row">
              <label>
                City
                <input
                  type="text"
                  name="city"
                  value={addressForm.city}
                  onChange={handleAddressInputChange}
                  required
                />
              </label>
              <label>
                State
                <input
                  type="text"
                  name="state"
                  value={addressForm.state}
                  onChange={handleAddressInputChange}
                />
              </label>
              <label>
                Country
                <input
                  type="text"
                  name="country"
                  value={addressForm.country}
                  onChange={handleAddressInputChange}
                  required
                />
              </label>
            </div>

            <div className="address-form-actions">
              <button type="button" className="order-action-btn ghost" onClick={closeAddressForm}>
                Cancel
              </button>
              <button type="submit" className="order-action-btn primary" disabled={savingAddress}>
                {savingAddress ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </form>
        )}
      </div>
    );
  };

  return (
    <div className="orders-page">
      <Header />
      <main className="orders-content">
        <div className="orders-container">
          <h1>My Orders</h1>

          {loading && <div className="orders-message">Loading your orders...</div>}
          {error && !loading && <div className="orders-error">{error}</div>}

          {!loading && !error && orders.length === 0 && (
            <div className="orders-empty-state">
              <p>You have not placed any orders yet.</p>
              <button className="order-action-btn primary" onClick={() => navigate('/products')}>
                Start Shopping
              </button>
            </div>
          )}

          {!loading && !error && orders.length > 0 && (
            <>
              {groupedOrders.active.length > 0 && (
                <section>
                  <h2 className="section-title">Active Orders</h2>
                  {groupedOrders.active.map(renderOrderCard)}
                </section>
              )}

              {groupedOrders.completed.length > 0 && (
                <section>
                  <h2 className="section-title">Completed Orders</h2>
                  {groupedOrders.completed.map(renderOrderCard)}
                </section>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrdersPage;

