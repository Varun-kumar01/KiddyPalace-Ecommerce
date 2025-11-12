import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Search, ShoppingCart, User, Home, MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import logo from '../components/assets/kp-logo.png';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { getCartCount } = useCart();
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showStoresDropdown, setShowStoresDropdown] = useState(false);
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  const [searchQuery, setSearchQuery] = useState('');
  // const typingTimeout = useRef(null);


  useEffect(() => {
    const handleClickOutside = (e) => {
    // Close search if clicked outside
    if (!e.target.closest('.mini-search') && !e.target.closest('.icon.search-icon')) {
      setSearchOpen(false);
    }

    // Close profile dropdown if clicked outside
    if (!e.target.closest('.auth-container')) {
      setShowAuthDropdown(false);
    }
  };
  
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
    // ✅ Fetch user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Fetch categories
  useEffect(() => {
    fetch('http://localhost:5000/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error('Error fetching categories:', err));
  }, []);

  const handleLoginClick = () => navigate('/login');
  const handleSignupClick = () => navigate('/signup');
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setShowAuthDropdown(false);
    // Inform cart context / app about user change
    try { window.dispatchEvent(new Event('user-changed')); } catch {}
    // Centered popup like login/signup success
    setToast({ show: true, message: 'Logged out successfully!' });
    setTimeout(() => setToast({ show: false, message: '' }), 1200);
  };

  const handleMouseEnter = async (categoryId) => {
    setHoveredCategory(categoryId);
    try {
      const res = await fetch(`http://localhost:5000/api/categories/${categoryId}/subcategories`);
      const data = await res.json();
      setSubcategories(data);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCategory(null);
    setSubcategories([]);
  };

  const handleNavigateCategory = (subcategory) => {
    navigate(`/products?subcategory=${encodeURIComponent(subcategory)}`);
    setHoveredCategory(null);
    setSubcategories([]);
  };

  const handleGiftCardsClick = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/giftcards');
      const data = await res.json();
      let cards = [];
      if (Array.isArray(data)) cards = data;
      else if (data && data.success && Array.isArray(data.giftcards)) cards = data.giftcards;
      if (cards.length > 0) {
        navigate(`/giftcards/${cards[0].id}`);
      } else {
        // Fallback to home if none
        navigate('/');
      }
    } catch (e) {
      navigate('/');
    }
  };

  return (
    <header className="header">
      <div className="top-announcement-container">
        {/* 📞 Phone Number on the Left */}
        <div className="top-contact">
          📞 +91 98765 43210
        </div>

        {/* 💥 Existing Sale Text */}
        <div className="top-announcement-text">A WORLD OF JOY, A WORLD OF WONDERS !</div>

        {/* 🌐 Social Icons + Our Stores */}
        <div className="top-right-section">
          <div className="social-icons">
            <a href="https://kiddypalace.in/" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="https://kiddypalace.in/" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="https://kiddypalace.in/" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="https://kiddypalace.in/" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-pinterest-p"></i>
            </a>
          </div>

          <div
            className="stores-dropdown-wrapper"
            onMouseEnter={() => setShowStoresDropdown(true)}
            onMouseLeave={() => setShowStoresDropdown(false)}
          >
            <button className="stores-dropdown-trigger">
              <Home size={16} style={{ marginRight: '6px' }} />
              Our Stores
            </button>
            {showStoresDropdown && (
              <div className="stores-dropdown">
                <div className="stores-dropdown-item">
                  <MapPin size={16} />
                  <span>Puppalaguda - 92912 55974</span>
                </div>
                <div className="stores-dropdown-item">
                  <MapPin size={16} />
                  <span>Nallagandla - 70758 84435</span>
                </div>
                <div className="stores-dropdown-item">
                  <MapPin size={16} />
                  <span>Narsingi - Opening Soon</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* 🔶 Main Navbar */}
      <div className="main-navbar">
        {/* Logo */}
        <div className="navbar-left" onClick={() => navigate('/')}>
          <a href="/"><img src={logo} alt="KP Logo" className="logo-img" /></a>
        </div>

        {/* Center Menu */}
        <div className="nav-center">
          <ul className="nav-list">
            <li className="nav-item">About</li>

            {/* Age Dropdown */}
            <li
              className="nav-item"
              onMouseEnter={() => setActiveDropdown('age')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="nav-btn">
                Age
                <ChevronDown
                  size={12}
                  strokeWidth={2.2}
                  className={`dropdown-arrow ${activeDropdown === 'age' ? 'rotate' : ''}`}
                />
              </button>
                {activeDropdown === 'age' && (
                  <ul className="simple-dropdown">
                    <li onClick={() => navigate('/products?age=0-18 Months')}>0-18 Months</li>
                    <li onClick={() => navigate('/products?age=18-36 Months')}>18-36 Months</li>
                    <li onClick={() => navigate('/products?age=3-5 Years')}>3-5 Years</li>
                    <li onClick={() => navigate('/products?age=5-7 Years')}>5-7 Years</li>
                    <li onClick={() => navigate('/products?age=7-9 Years')}>7-9 Years</li>
                    <li onClick={() => navigate('/products?age=9-12 Years')}>9-12 Years</li>
                    <li onClick={() => navigate('/products?age=12+ Years')}>12+ Years</li>
                  </ul>
                )}
            </li>

            <li className="nav-item" onClick={() => navigate('/products?sort=new')}>
              New Arrivals
            </li>

            {/* Categories Dropdown */}
            <li
              className="nav-item"
              onMouseEnter={() => setActiveDropdown('categories')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="nav-btn">
                Categories
                <ChevronDown
                  size={12}
                  strokeWidth={2.2}
                  className={`dropdown-arrow ${activeDropdown === 'categories' ? 'rotate' : ''}`}
                />
              </button>

              {activeDropdown === 'categories' && (
                <div className="categories-panel">
                  <div className="panel-left">
                    <ul className="panel-categories">
                      {categories.map((cat) => (
                        <li
                          key={cat.sno}
                          className={`panel-category ${hoveredCategory === cat.sno ? 'active' : ''}`}
                          onMouseEnter={() => handleMouseEnter(cat.sno)}
                        >
                          {cat.category_name}
                          <ChevronRight size={12} className="sub-arrow" />
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="panel-right">
                    <div className="subheading">Subcategories</div>
                    <ul className="panel-subcategories">
                      {subcategories.length > 0 ? (
                        subcategories.map((sub) => (
                          <li
                            key={sub.sno}
                            onClick={() => handleNavigateCategory(sub.subcategory_name)}
                          >
                            {sub.subcategory_name}
                            <ChevronRight size={11} className="sub-arrow" />
                          </li>
                        ))
                      ) : (
                        <li className="empty">Hover a category to view subcategories</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </li>

            {/* Brand Dropdown */}
            <li
              className="nav-item"
              onMouseEnter={() => setActiveDropdown('brand')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="nav-btn">
                Brand
                <ChevronDown
                  size={12}
                  strokeWidth={2.2}
                  className={`dropdown-arrow ${activeDropdown === 'brand' ? 'rotate' : ''}`}
                />
              </button>
              {activeDropdown === 'brand' && (
                <ul className="simple-dropdown">
                  <li onClick={() => navigate('/products?brand=Picasso')}>Picasso</li>
                  <li onClick={() => navigate('/products?brand=Linograph')}>Linograph</li>
                  <li onClick={() => navigate('/products?brand=Mattel')}>Mattel</li>
                  <li onClick={() => navigate('/products?brand=Sakura')}>Sakura</li>
                  <li onClick={() => navigate('/products?brand=Market')}>Market</li>
                  <li onClick={() => navigate('/products?brand=Maped')}>Maped</li>
                  <li onClick={() => navigate('/products?brand=3M')}>3M</li>
                  <li onClick={() => navigate('/products?brand=Apsara')}>Apsara</li>
                  <li onClick={() => navigate('/products?brand=DELI')}>DELI</li>
                  <li onClick={() => navigate('/products?brand=Camel')}>Camel</li>
                  <li onClick={() => navigate('/products?brand=CASIO')}>CASIO</li>
                  <li onClick={() => navigate('/products?brand=ABRO')}>ABRO</li>
                </ul>
              )}
            </li>

            <li className="nav-item" onClick={() => navigate('/products?sort=new')}>
              Characters and Themes
            </li>

            <li className="nav-item" onClick={() => navigate('/products?sort=new')}>
              Customized Products
            </li>

            <li className="nav-item" onClick={() => navigate('/offers')}>
              Special Offers
            </li>
            <li className="nav-item" onClick={handleGiftCardsClick}>
              Gift Cards
            </li>
            {/* ✅ Role-Based Admin Access */}
            {user?.role === 'super_admin' && (
              <li className="nav-item" onClick={() => navigate('/admin')}>
                Admin Dashboard
              </li>
            )}
          </ul>
        </div>

        {/* Right Icons */}
        <div className="navbar-right">
          {/* Search Icon */}
          <div className="icon search-icon" onClick={() => setSearchOpen((prev) => !prev)}>
            <Search size={22} />
          </div>

          {searchOpen && (
  <div className="mini-search">
    <input
      type="text"
      placeholder="Search..."
      value={searchQuery}
      onChange={(e) => {
        const value = e.target.value;
        setSearchQuery(value);

        // 🔹 Automatically navigate and update products while typing
        if (value.trim().length >= 2) {
          navigate(`/products?search=${encodeURIComponent(value.trim())}`);
        } else if (value.trim().length === 0) {
          // Clear search: show all products again
          navigate(`/products`);
        }
      }}
      onKeyDown={(e) => {
        // Still support Enter key if user presses it
        if (e.key === 'Enter' && e.target.value.trim()) {
          navigate(`/products?search=${encodeURIComponent(e.target.value.trim())}`);
          setSearchOpen(false);
        }
      }}
    />
  </div>
)}


          {/* 👤 Profile Section */}
          <div className="auth-container">
            {/* Profile Icon */}
            <div
              className="icon"
              onClick={() => setShowAuthDropdown(!showAuthDropdown)}
            >
              <User size={22} />
            </div>

            {/* Dropdown Menu */}
            <div className={`auth-dropdown ${showAuthDropdown ? 'show' : ''}`}>
              {user ? (
                <>
                  <span className="user-greeting">
                    Hi, {user.firstName || user.fullName} {user.role === 'super_admin' && '(Admin)'}
                  </span>
                  <button
                    className="orders-btn"
                    onClick={() => {
                      navigate('/orders');
                      setShowAuthDropdown(false);
                    }}
                  >
                    My Orders
                  </button>

                  <button className="logout-btn" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button className="login-btn" onClick={handleLoginClick}>
                    Login
                  </button>
                  <button className="signup-btn" onClick={handleSignupClick}>
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Cart */}
          <div
            className="cart-icon-wrapper"
            onClick={() => navigate('/cart')}
            style={{ cursor: 'pointer', position: 'relative', marginRight: '20px' }}
          > 
            <div className="cart-icon">
              <ShoppingCart size={22} color="BLACK" />
            </div>
            {getCartCount() > 0 && <span className="cart-badge">{getCartCount()}</span>}
          </div>
        </div>
      </div>
      {/* Centered Popup Toast for logout */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(2px)'
          }}
        >
          <div
            style={{
              background: '#fff7eb',
              color: '#273c2e',
              border: '1px solid rgba(182, 158, 106, 0.35)',
              borderRadius: 18,
              boxShadow: '0 18px 40px rgba(39, 60, 46, 0.18)',
              padding: '24px 28px',
              width: 'min(92vw, 440px)',
              textAlign: 'center',
              transform: 'scale(1)',
              animation: 'kpScaleIn 240ms ease-out',
              fontWeight: 700,
              position: 'relative'
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                margin: '0 auto 12px',
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background: 'linear-gradient(135deg, #6fbf8c, #4f8f70)',
                color: '#fff7eb',
                boxShadow: '0 8px 20px rgba(111,191,140,0.35)',
                border: '2px solid rgba(255,255,255,0.55)'
              }}
            >
              ✓
            </div>
            <div style={{ fontSize: 18, letterSpacing: 0.2, marginBottom: 4 }}>
              {toast.message}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#4f6354' }}>
              See you soon!
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;