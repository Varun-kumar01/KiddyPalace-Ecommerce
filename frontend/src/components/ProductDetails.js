import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Header from './Header';
import Footer from './Footer';
import './ProductDetails.css';

const ProductDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { product } = location.state || {};
  const { addToCart } = useCart();

  const [activeSection, setActiveSection] = useState("returns");

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
              {images.map((img, i) => (
                <img key={i} src={img} alt={`thumb-${i}`} className="thumbnail" />
              ))}
            </div>
            <div className="main-image">
              <img src={product.image} alt={product.name} />
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
              <button className="buy-btn">Buy Now</button>
            </div>

            {/* <div className="pincode-section">
              <p>Pincode Check:</p>
              <input type="text" placeholder="Enter your pincode" />
              <button className="check-btn">Check</button>
            </div> */}
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

          {/* <div className="accordion-item">
            <button className="accordion-header" onClick={() => toggleAccordion(2)}>
              Product Details <span>{activeSection === 2 ? "−" : "+"}</span>
            </button>
            {activeSection === 2 && (
              <div className="accordion-content">
                {product.product_details ? (
                  <p>{product.product_details}</p>
                ) : (
                  <p>No product details available</p>
                )}
              </div>
            )}
          </div> */}

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

          {/* <div className="accordion-item">
            <button className="accordion-header" onClick={() => toggleAccordion(4)}>
              Additional Details <span>{activeSection === 4 ? "−" : "+"}</span>
            </button>
            {activeSection === 4 && (
              <div className="accordion-content">
                {product.additional_details ? (
                  <p>{product.additional_details}</p>
                ) : (
                  <p>No additional details available</p>
                )}
              </div>
            )}
          </div> */}
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
