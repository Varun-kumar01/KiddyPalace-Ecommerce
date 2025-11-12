import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Header from './Header';
import Footer from './Footer';
import './ProductsPage.css';

const ProductsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [highlightedProduct, setHighlightedProduct] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const productRefs = useRef({});

  // 🔹 New state for sorting
  const [sortOrder, setSortOrder] = useState('none');

  // Filters state (synced with URL)
  const [filters, setFilters] = useState({
    priceRange: 'all',
    ageRange: 'all',
    brand: 'all',
  });

  // 🔹 Restore filters from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const price = params.get('price') || 'all';
    const age = params.get('age') || 'all';
    const brand = params.get('brand') || 'all';

    const reverseAgeMap = {
      '0-18 Months': '0-18-months',
      '18-36 Months': '18-36-months',
      '3-5 Years': '3-5-years',
      '5-7 Years': '5-7-years',
      '7-9 Years': '7-9-years',
      '9-12 Years': '9-12-years',
      '12+ Years': '12+',
    };

    setFilters({
      priceRange: price,
      ageRange: reverseAgeMap[age] || age,
      brand: brand,
    });
  }, [location.search]);

  // 🔹 Extract URL query parameters
  const searchParams = new URLSearchParams(location.search);
  const searchTerm = searchParams.get('search')?.toLowerCase() || '';
  const subcategory = searchParams.get('subcategory')?.toLowerCase() || '';
  const age = searchParams.get('age') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const price = searchParams.get('price') || '';

  useEffect(() => {
    fetchProducts();

    if (location.state?.selectedProductId) {
      const productId = location.state.selectedProductId;
      setHighlightedProduct(productId);

      setTimeout(() => {
        const element = productRefs.current[productId];
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);

      setTimeout(() => setHighlightedProduct(null), 2500);
    }
  }, [location.search]);

  const fetchProducts = async () => {
    try {
      let url = 'http://localhost:5000/api/products';
      if (subcategory) {
        url = `http://localhost:5000/api/products/by-subcategory/${encodeURIComponent(
          subcategory
        )}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
      } else {
        setMessage('No products found.');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    if (product.stock_quantity <= 0) {
      setMessage('This product is out of stock');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    addToCart(product);
    setPopupMessage(`${product.name} added to cart!`);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 1000);
  };

  const handleProductClick = (product) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(`/product/${product.id}`, { state: { product } });
  };

  // 🔹 Filter change handler (sync to URL)
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));

    const params = new URLSearchParams(location.search);

    if (name === 'priceRange') {
      if (value === 'all') params.delete('price');
      else params.set('price', value);
    }

    if (name === 'brand') {
      if (value === 'all') params.delete('brand');
      else params.set('brand', value);
    }

    if (name === 'ageRange') {
      if (value === 'all') params.delete('age');
      else {
        const labelMap = {
          '0-18-months': '0-18 Months',
          '18-36-months': '18-36 Months',
          '3-5-years': '3-5 Years',
          '5-7-years': '5-7 Years',
          '7-9-years': '7-9 Years',
          '9-12-years': '9-12 Years',
          '12+': '12+ Years',
        };
        params.set('age', labelMap[value] || value);
      }
    }

    navigate({ pathname: location.pathname, search: params.toString() });
  };

  const parseAgeToMonths = (str) => {
    if (!str) return null;
    const s = String(str).toLowerCase().replace(/\s+/g, '');
    const monthsMatch = s.match(/^(\d+)-(\d+)months$/);
    if (monthsMatch)
      return [parseInt(monthsMatch[1], 10), parseInt(monthsMatch[2], 10)];
    const yearsMatch = s.match(/^(\d+)-(\d+)years$/);
    if (yearsMatch)
      return [parseInt(yearsMatch[1], 10) * 12, parseInt(yearsMatch[2], 10) * 12];
    const plusYears = s.match(/^(\d+)\+years$/);
    if (plusYears) return [parseInt(plusYears[1], 10) * 12, Infinity];
    const plusMonths = s.match(/^(\d+)\months\+$/) || s.match(/^(\d+)\+months$/);
    if (plusMonths) return [parseInt(plusMonths[1], 10), Infinity];
    return null;
  };

  const rangesOverlap = (a, b) => {
    if (!a || !b) return false;
    const [aStart, aEnd] = a;
    const [bStart, bEnd] = b;
    const aE = Number.isFinite(aEnd) ? aEnd : Number.MAX_SAFE_INTEGER;
    const bE = Number.isFinite(bEnd) ? bEnd : Number.MAX_SAFE_INTEGER;
    return aStart <= bE && bStart <= aE;
  };

  const parsePriceRange = (str) => {
    if (!str) return null;
    const s = String(str).toLowerCase().replace(/\s+/g, '');
    const range = s.match(/^(\d+)-(\d+)$/);
    if (range) return [parseInt(range[1], 10), parseInt(range[2], 10)];
    const plus = s.match(/^(\d+)\+$/);
    if (plus) return [parseInt(plus[1], 10), Infinity];
    return null;
  };

  const selectedAgeRangeURL = age ? parseAgeToMonths(age) : null;
  const selectedPriceRangeURL = price ? parsePriceRange(price) : null;
  const selectedBrandURL = brand ? brand.toLowerCase() : '';

  const selectedAgeRangeLocal =
    filters.ageRange !== 'all'
      ? parseAgeToMonths(filters.ageRange.replace(/$/, ' years'))
      : null;
  const selectedPriceRangeLocal =
    filters.priceRange !== 'all' ? parsePriceRange(filters.priceRange) : null;
  const selectedBrandLocal =
    filters.brand !== 'all' ? filters.brand.toLowerCase() : '';

  const filteredProducts = products.filter((p) => {
    let ok = true;

    if (searchTerm) {
      const hay = `${p.name || ''} ${p.description || ''}`.toLowerCase();
      ok = ok && hay.includes(searchTerm);
    }

    if (selectedAgeRangeURL) {
      const prodRange = parseAgeToMonths(p.age_range || '');
      ok = ok && rangesOverlap(prodRange, selectedAgeRangeURL);
    }

    if (ok && selectedAgeRangeLocal) {
      const prodRange = parseAgeToMonths(p.age_range || '');
      ok = ok && rangesOverlap(prodRange, selectedAgeRangeLocal);
    }

    if (ok && selectedBrandURL) {
      ok = ok && p.brand_name?.toLowerCase() === selectedBrandURL;
    }

    if (ok && selectedBrandLocal) {
      ok = ok && p.brand_name?.toLowerCase() === selectedBrandLocal;
    }

    if (ok && selectedPriceRangeURL) {
      const [minP, maxP] = selectedPriceRangeURL;
      const priceNum = Number(p.price);
      ok = ok && priceNum >= minP && priceNum <= (maxP || Number.MAX_SAFE_INTEGER);
    }

    if (ok && selectedPriceRangeLocal) {
      const [minP, maxP] = selectedPriceRangeLocal;
      const priceNum = Number(p.price);
      ok = ok && priceNum >= minP && priceNum <= (maxP || Number.MAX_SAFE_INTEGER);
    }

    return ok;
  });

  // 🔹 Apply sorting to filtered products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOrder === 'lowToHigh') return a.price - b.price;
    if (sortOrder === 'highToLow') return b.price - a.price;
    return 0;
  });

  if (loading) {
    return (
      <div className="products-page">
        <Header />
        <main className="products-content">
          <div className="loading">Loading products...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="products-page">
      <Header />
      <main className="products-layout">
        {/* Sidebar Filters */}
        <aside className="filters-sidebar">
          <div className="filter-section">
            <h3>Filters</h3>

            {/* Price Filter */}
            <div className="filter-group">
              <h4>Price Range</h4>
              <select
                name="priceRange"
                value={filters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
              >
                <option value="all">All Prices</option>
                <option value="0-25">₹0 – ₹25</option>
                <option value="26-50">₹26 – ₹50</option>
                <option value="51-100">₹51 – ₹100</option>
                <option value="101-250">₹101 – ₹250</option>
                <option value="251-500">₹251 – ₹500</option>
                <option value="501-1000">₹501 – ₹1000</option>
                <option value="1001-1500">₹1001 – ₹1500</option>
                <option value="1500+">₹1500+</option>
              </select>
            </div>

            {/* Age Filter */}
            <div className="filter-group">
              <h4>Age Range</h4>
              <select
                name="ageRange"
                value={filters.ageRange}
                onChange={(e) => handleFilterChange('ageRange', e.target.value)}
              >
                <option value="all">All Age Ranges</option>
                <option value="0-18-months">0–18 Months</option>
                <option value="18-36-months">18–36 Months</option>
                <option value="3-5-years">3–5 Years</option>
                <option value="5-7-years">5–7 Years</option>
                <option value="7-9-years">7–9 Years</option>
                <option value="9-12-years">9–12 Years</option>
                <option value="12+">12+ Years</option>
              </select>
            </div>

            {/* Brand Filter */}
            <div className="filter-group">
              <h4>Brand</h4>
              <select
                name="brand"
                value={filters.brand}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
              >
                <option value="all">All Brands</option>
                {[...new Set(products.map((p) => p.brand_name).filter(Boolean))].map(
                  (b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Clear Filters */}
            <button
              className="clear-filters-btn"
              onClick={() => {
                setFilters({ priceRange: 'all', ageRange: 'all', brand: 'all' });
                navigate('/products');
              }}
            >
              Clear Filters
            </button>
          </div>
        </aside>

        {/* Products Section */}
        <section className="products-section">
          <div className="products-header">
            <h1>
              {age
                ? `Products for ${age}`
                : subcategory
                ? subcategory.toUpperCase()
                : category
                ? `Category Products`
                : 'Our Products'}
            </h1>

            {/* 🔹 Sort By Dropdown */}
            <div className="sort-by">
              <label>Sort by:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="none">Default</option>
                <option value="lowToHigh">Price: Low to High</option>
                <option value="highToLow">Price: High to Low</option>
              </select>
            </div>
          </div>

          {message && <div className="message error">{message}</div>}

          {sortedProducts.length === 0 ? (
            <div className="no-products">
              <p>No products found.</p>
            </div>
          ) : (
            <div className="products-grid">
              {sortedProducts.map((product) => (
                <div
                  key={product.id}
                  ref={(el) => (productRefs.current[product.id] = el)}
                  className={`product-card ${
                    highlightedProduct === product.id ? 'highlighted' : ''
                  }`}
                  onClick={() => handleProductClick(product)}
                >
                  <div className="product-image-container">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="product-image"
                        onError={(e) => {
                          console.error('Image failed to load for product:', product.name);
                          e.target.style.display = 'none';
                          e.target.nextSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div
                      className={`no-product-image ${
                        product.image ? 'hidden' : ''
                      }`}
                    >
                      <span>📦</span>
                      <p>No Image</p>
                    </div>
                  </div>

                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <div className="product-footer">
                      <span className="product-price">₹{product.price}</span>
                      <button
                        className={`add-to-cart-btn ${
                          product.stock_quantity <= 0 ? 'disabled' : ''
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        disabled={product.stock_quantity <= 0}
                      >
                        {product.stock_quantity <= 0
                          ? 'Out of Stock'
                          : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {showPopup && (
          <div className="popup-overlay">
            <div className="popup-box">
              <p>{popupMessage}</p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductsPage;
