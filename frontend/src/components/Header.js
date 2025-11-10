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
    localStorage.removeItem('cart');
    setUser(null);
    setShowAuthDropdown(false);
    window.location.reload();
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
            <li className="nav-item" onClick={() => navigate('/giftcards')}>
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
                onKeyDown={(e) => {
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

            <div className={`auth-dropdown ${showAuthDropdown ? 'show' : ''}`}>
              {user ? (
                <>
                  <span className="user-greeting">
                    Hi, {user.firstName || user.fullName} {user.role === 'super_admin' && '(Admin)'}
                  </span>

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
    </header>
  );
};

export default Header;