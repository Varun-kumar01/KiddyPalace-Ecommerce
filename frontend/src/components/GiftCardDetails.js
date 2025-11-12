import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import './GiftCardDetails.css';
import { useCart } from '../context/CartContext';

const GiftCardDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [card, setCard] = useState(null);
  const [otherCards, setOtherCards] = useState([]);
  const [selectedValue, setSelectedValue] = useState(null);
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();
  const [gallery, setGallery] = useState([]);
  const priceOptions = React.useMemo(() => {
    try {
      if (!card || !card.price_options) return [];
      const parsed = JSON.parse(card.price_options);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }, [card]);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/api/giftcards/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError((data && data.message) || 'Failed to load gift card');
          return;
        }

        // Accept both raw row object and wrapped shapes
        if (data && data.id) {
          setCard(data);
          // initialize selection from price_options or base_price
          try {
            const parsed = data.price_options ? JSON.parse(data.price_options) : [];
            if (Array.isArray(parsed) && parsed.length > 0) setSelectedValue(parsed[0]);
            else setSelectedValue(Number(data.base_price) || null);
          } catch (_) {
            setSelectedValue(Number(data.base_price) || null);
          }
          return;
        }
        if (data && data.success && data.giftcard) {
          setCard(data.giftcard);
          try {
            const parsed = data.giftcard.price_options ? JSON.parse(data.giftcard.price_options) : [];
            if (Array.isArray(parsed) && parsed.length > 0) setSelectedValue(parsed[0]);
            else setSelectedValue(Number(data.giftcard.base_price) || null);
          } catch (_) {
            setSelectedValue(Number(data.giftcard.base_price) || null);
          }
          return;
        }

        // Fallback: unexpected shape
        setError('Invalid response format');
      } catch (err) {
        setError('Unable to connect to server');
      } finally {
        setLoading(false);
      }
    };
    fetchCard();
    // Load other gift cards list
    const fetchOthers = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/giftcards');
        const data = await res.json();
        let list = [];
        if (Array.isArray(data)) list = data; else if (data && data.success && Array.isArray(data.giftcards)) list = data.giftcards;
        setOtherCards(list.filter(gc => String(gc.id) !== String(id)));
      } catch (_) {
        setOtherCards([]);
      }
    };
    fetchOthers();
    // Load gallery images
    const fetchGallery = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/giftcards/${id}/images`);
        const data = await res.json();
        if (data && data.success && Array.isArray(data.images)) {
          const urls = data.images.map((u) => (typeof u === 'string' && u.startsWith('http') ? u : `http://localhost:5000${u}`));
          setGallery(urls);
        } else {
          setGallery(card?.image_url ? [`http://localhost:5000${card.image_url}`] : []);
        }
      } catch (_) {
        setGallery([]);
      }
    };
    fetchGallery();
  }, [id]);

  const handleAddToBag = () => {
    if (!card) return;
    const price = Number(selectedValue || card.base_price || 0);
    const quantity = parseInt(qty || 1, 10);
    if (!price || quantity <= 0) return;
    const product = {
      id: `giftcard-${card.id}-${price}`,
      name: `${card.title} (Gift Card)`,
      price,
      image: card.image_url ? `http://localhost:5000${card.image_url}` : undefined,
    };
    addToCart(product, quantity);
  };

  return (
    <div className="giftcard-details-page">
      <Header />
      <main className="giftcard-details-container">
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {card && (
          <>
          <div className="giftcard-details-grid">
            <div className="giftcard-image-box">
              {gallery && gallery.length > 0 ? (
                <img src={gallery[0]} alt={card.title} />
              ) : card.image_url ? (
                <img src={`http://localhost:5000${card.image_url}`} alt={card.title} />
              ) : (
                <div className="giftcard-no-image">No Image</div>
              )}
            </div>
            <div>
              <h1 className="giftcard-title">{card.title}</h1>
              <p className="giftcard-meta"><span className="meta-label">Brand:</span> {card.brand}</p>
              <p className="giftcard-meta"><span className="meta-label">SKU:</span> {card.sku}</p>
              <p className="giftcard-meta"><span className="meta-label">Price:</span> ₹{Number(selectedValue || card.base_price || 0)}</p>

              {/* Render price options as selectable chips if JSON array */}
              {priceOptions.length > 0 ? (
                <div className="giftcard-options">
                  <div className="giftcard-options-label">Available Values</div>
                  <div className="giftcard-options-list">
                    {priceOptions.map((v, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`giftcard-chip ${Number(selectedValue) === Number(v) ? 'selected' : ''}`}
                        onClick={() => setSelectedValue(v)}
                      >
                        ₹{v}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                card.price_options ? (
                  <p><strong>Available Values:</strong> {card.price_options}</p>
                ) : null
              )}

              {/* Quantity + Add to Bag */}
              <div className="giftcard-buy-row">
                <label className="giftcard-qty-label">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value || '1', 10))}
                  className="giftcard-qty-input"
                />
                <button className="giftcard-add-btn" onClick={handleAddToBag}>
                  Add to Bag
                </button>
              </div>

              <div className="giftcard-description">{card.description}</div>
            </div>
          </div>

          {(gallery && gallery.length > 1) ? (
            <div className="giftcard-thumbs">
              {gallery.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="giftcard-thumb-btn"
                  onClick={() => {
                    setGallery((g) => {
                      const copy = [...g];
                      const [sel] = copy.splice(idx, 1);
                      return [sel, ...copy];
                    });
                  }}
                >
                  <img src={url} alt={`thumb-${idx}`} />
                </button>
              ))}
            </div>
          ) : null}
          </>
        )}

        {otherCards.length > 0 && (
          <div className="giftcard-related">
            <h2 className="giftcard-related-title">More Gift Cards</h2>
            <div className="giftcard-related-grid">
              {otherCards.map(gc => (
                <div key={gc.id} className="giftcard-related-card">
                  <div className="giftcard-related-thumb">
                    {gc.image_url ? (
                      <img src={`http://localhost:5000${gc.image_url}`} alt={gc.title} onClick={() => navigate(`/giftcards/${gc.id}`)} />
                    ) : (
                      <span className="no-image">No Image</span>
                    )}
                  </div>
                  <div className="giftcard-related-body">
                    <div className="giftcard-related-name">{gc.title}</div>
                    <div className="giftcard-related-brand">{gc.brand}</div>
                    <div className="giftcard-related-price">₹{(() => {
                      try {
                        const opts = gc.price_options ? JSON.parse(gc.price_options) : [];
                        if (Array.isArray(opts) && opts.length > 0) return Number(opts[0]);
                      } catch (_) {}
                      return Number(gc.base_price || 0);
                    })()}</div>
                    <button
                      className="giftcard-related-add"
                      onClick={() => {
                        let p = 0;
                        try {
                          const opts = gc.price_options ? JSON.parse(gc.price_options) : [];
                          if (Array.isArray(opts) && opts.length > 0) p = Number(opts[0]);
                        } catch (_) {}
                        if (!p) p = Number(gc.base_price || 0);
                        const product = {
                          id: `giftcard-${gc.id}-${p}`,
                          name: `${gc.title} (Gift Card)`,
                          price: p,
                          image: gc.image_url ? `http://localhost:5000${gc.image_url}` : undefined,
                        };
                        addToCart(product, 1);
                      }}
                    >
                      Add to Bag
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default GiftCardDetails;
