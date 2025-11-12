import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams,  } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Header from './Header';
import Footer from './Footer';
import './ProductDetails.css';

const ProductDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [product, setProduct] = useState(() => (location.state && location.state.product) ? location.state.product : null);
  const [loading, setLoading] = useState(!((location.state && location.state.product)));
  const [error, setError] = useState("");
  const { addToCart } = useCart();

  const [activeSection, setActiveSection] = useState("returns");
  const [activeImage, setActiveImage] = useState(null);

  const toggleAccordion = (index) => {
    setActiveSection(activeSection === index ? null : index);
  };

  // Debug logging
  if (product) {
    console.log('Product Details Data:', product);
    console.log('Highlights:', product.highlights);
    console.log('Product Details:', product.product_details);
    console.log('Specifications:', product.specifications);
    console.log('Additional Details:', product.additional_details);
  }

  const productId = useMemo(() => {
    if (location.state && location.state.product?.id) return location.state.product.id;
    if (params && params.id) return params.id;
    return null;
  }, [location.state, params]);

  // Keep local product state in sync with navigation state
  useEffect(() => {
    if (location.state && location.state.product) {
      setProduct(location.state.product);
    }
  }, [location.state]);

  const imageSources = useMemo(() => {
    if (!product) return [];

    const orderedSources = [
      ...(Array.isArray(product.imageGallery) ? product.imageGallery : []),
      ...(Array.isArray(product.images) ? product.images : []),
      product.image,
      ...(Array.isArray(product.additionalImages) ? product.additionalImages : [])
    ].filter(Boolean);

    const uniqueSources = [];
    const seen = new Set();

    orderedSources.forEach((src) => {
      if (!seen.has(src)) {
        seen.add(src);
        uniqueSources.push(src);
      }
    });

    return uniqueSources;
  }, [product]);

  useEffect(() => {
    if (imageSources.length === 0) {
      setActiveImage(null);
      return;
    }

    setActiveImage((current) => (current && imageSources.includes(current) ? current : imageSources[0]));
  }, [imageSources]);

  useEffect(() => {
    if (!productId) return;

    const needsRefresh =
      !product ||
      String(product.id) !== String(productId) ||
      !Array.isArray(product.imageGallery);

    if (!needsRefresh) return;

    const controller = new AbortController();
    const fetchProduct = async () => {
      try {
        if (!product) {
          setLoading(true);
        }
        const res = await fetch(`http://localhost:5000/api/products/${productId}`, { signal: controller.signal });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch product');
        }
        setProduct(data.product);
      } catch (e) {
        if (e.name !== 'AbortError') {
          setError(e.message || 'Failed to load product');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    return () => controller.abort();
  }, [productId, product]);

  // const toggleAccordion = (index) => {
  //   setActiveSection(activeSection === index ? null : index);
  // };

  if (loading) {
    return (
      <div className="no-product">
        <p>Loading product...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="no-product">
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="no-product">
        <p>Product not found.</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const images = product.images || [product.image]; // handle multiple images

  return (
    <div className="product-details-page">
      <Header />

      <main className="product-details-content">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span onClick={() => navigate('/')}>Home</span> &gt; {product.category} &gt; {product.name}
        </div>

        {/* Product Section */}
        <div className="product-details-container">
          {/* Left: Images */}
          <div className="product-images">
            <div className="thumbnails">
              {imageSources.map((img, i) => (
                <img key={i} src={img} alt={`thumb-${i}`} 
                className={`thumbnail ${activeImage === img ? 'active' : ''}`}
                onClick={() => setActiveImage(img)} />
              ))}
            </div>
            <div className="main-image">
              <img
                src={activeImage || product.image || imageSources[0] || ''}
                alt={product.name}
              />
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="product-info-section">
            <h2 className="brand">{product.brand_name || product.brand || 'Brand Name'}</h2>
            <h1>{product.name}</h1>
            <p className="description">{product.description}</p>
            {product.age_range && <p className="age-range">Age Range: {product.age_range}</p>}
            {product.gender && <p className="gender">Gender: {product.gender}</p>}

            <div className="price-section">
              <span className="mrp">MRP ₹{product.mrp || product.mrp}</span>
              <span className="price">₹{product.price}</span>
              <span className="discount">Save {product.discount}%</span>
            </div>

            <p className="stock-status">{product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}</p>

            <div className="actions">
              <button className="add-btn" onClick={() => addToCart(product)}>Add to bag</button>
              <button className="buy-btn" onClick={() => navigate('/checkout', { state: { product } })}>Buy Now</button>
            </div>
          </div>
        </div>

        {/* ✅ Product Info (Dynamic from Database) */}
        <div className="product-info">
          <h2>{product.name}</h2>
          <p>{product.description}</p>
        </div>

        {/* Accordion Section */}
        <div className="accordion">
          <div className="accordion-item">
            <button className="accordion-header" onClick={() => toggleAccordion(1)}>
              Product Highlights <span>{activeSection === 1 ? "−" : "+"}</span>
            </button>
            {activeSection === 1 && (
              <div className="accordion-content">
                {product.highlights ? (
                  <ul>
                    {product.highlights.split('\n').map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No highlights available</p>
                )}
              </div>
            )}
          </div>

          

          <div className="accordion-item">
            <button className="accordion-header" onClick={() => toggleAccordion(3)}>
              Product Specifications <span>{activeSection === 3 ? "−" : "+"}</span>
            </button>
            {activeSection === 3 && (
              <div className="accordion-content">
                {product.specifications ? (
                  <p>{product.specifications}</p>
                ) : (
                  <p>No specifications available</p>
                )}
              </div>
            )}
          </div>


        </div>

        {/* Tabs Section */}
        <div className="tabs">
          <div className="tab-headers">
            <button
              className={activeSection === "returns" ? "active" : ""}
              onClick={() => setActiveSection("returns")}
            >
              RETURNS
            </button>
            <button
              className={activeSection === "promise" ? "active" : ""}
              onClick={() => setActiveSection("promise")}
            >
              OUR PROMISE
            </button>
            <button
              className={activeSection === "care" ? "active" : ""}
              onClick={() => setActiveSection("care")}
            >
              CUSTOMER CARE
            </button>
          </div>

          <div className="tab-content">
            {activeSection === "returns" && (
              <p>
                Easy 30 days return. Returns policies may vary based on products
                and promotions. For full details on our Returns Policies,{" "}
                <a href="#">click here</a>.
              </p>
            )}
            {activeSection === "promise" && (
              <p>
                We promise 100% quality assurance and ensure safe, durable, and
                child-friendly toys.
              </p>
            )}
            {activeSection === "care" && (
              <p>
                For any product-related queries, contact us at care@fuzzbuzz.com or call 1800-123-456.
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetails;
