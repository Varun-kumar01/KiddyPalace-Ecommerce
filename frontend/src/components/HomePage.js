import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Header from './Header';
import Footer from './Footer';
import './HomePage.css';
import slide1 from "../components/assets/slides/slide1.jpg";
import slide2 from "../components/assets/slides/slide2.jpg";
import slide3 from "../components/assets/slides/slide3.jpg";

// age images

import img018 from '../components/assets/slides/0-18.png';
import img1836 from '../components/assets/slides/18-36.png';
import img0305 from '../components/assets/slides/3-5.png';
import img0507 from '../components/assets/slides/5-7.png';
import img0709 from '../components/assets/slides/7-9.png';
import img0912 from '../components/assets/slides/9-12.png';
import img12 from '../components/assets/slides/12+.png';


//Import brand images
import brand3M from "../components/assets/slides/3M.jpg";
import brandApsara from "../components/assets/slides/Apsara.jpg";
import brandCamel from "../components/assets/slides/Camel.jpg";
import brandCasio from "../components/assets/slides/Casio.jpg";
import brandClassmate from "../components/assets/slides/Classmate_stationary.jpg";
import brandDuracell from "../components/assets/slides/Duracell.jpg";
import brandHauser from "../components/assets/slides/Hauser.jpg";
import brandLinc from "../components/assets/slides/Linc.jpg";
import brandMontex from "../components/assets/slides/Montex.jpg";
import brandNataraj from "../components/assets/slides/Nataraj.jpg";
import brandParker from "../components/assets/slides/Parker.jpg";
import brandPaperkraft from "../components/assets/slides/paperkraft.jpg";
import brandPilot from "../components/assets/slides/Pilot.jpg";
import brandReynolds from "../components/assets/slides/Reynolds.jpg";

import barbie from "../components/assets/slides/barbie.jpg";
import mickey from "../components/assets/slides/mickey.jpg";
import spider from "../components/assets/slides/spider.png";  
import pepa from "../components/assets/slides/pepa.png";
import harry1 from "../components/assets/slides/harry1.png";
import avengers from "../components/assets/slides/avengers.png";
import disney from "../components/assets/slides/disney.png";
import forzon from "../components/assets/slides/forzon.png";
import pokeman from "../components/assets/slides/pokeman.png";

// 🖼️ Import category images (hardcoded but matched by index)
import cat1 from "../components/assets/slides/wriring.jpeg";
import cat2 from "../components/assets/slides/paper products.jpg";
import cat3 from "../components/assets/slides/accessories.jpeg";
import cat4 from "../components/assets/slides/stationary.jpg";
import cat5 from "../components/assets/slides/games and toys.jpg";
import cat6 from "../components/assets/slides/arts and crafts.jpg";


const Slider = ({ slides = [], interval = 2000 }) => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const isHovering = useRef(false);

  useEffect(() => {
    start();
    return stop;
  }, [current]);

  const start = () => {
    stop();
    timerRef.current = setInterval(() => {
      if (!isHovering.current) {
        setCurrent((c) => (c + 1) % slides.length);
      }
    }, interval);
  };

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const next = () => {
    stop();
    setCurrent((c) => (c + 1) % slides.length);
  };

  const prev = () => {
    stop();
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    stop();
    setCurrent(index);
  };

  if (!slides.length) return null;

  return (
    <div
      className="fade-slider"
      onMouseEnter={() => (isHovering.current = true)}
      onMouseLeave={() => (isHovering.current = false)}
    >
      {slides.map((s, i) => (
        <div key={i} className={`fade-slide ${i === current ? "active" : ""}`}>
          <img src={s.image} alt={s.title} className="slide-img" />
          <div className="fade-overlay">
            <h1>{s.title}</h1>
            <p>{s.subtitle}</p>
            {s.cta && (
              <button className="cta-button" onClick={s.onClick}>
                {s.cta}
              </button>
            )}
          </div>
        </div>
      ))}

      {/* 👇 Navigation Arrows (always visible) */}
      {/* <button className="slider-btn prev" onClick={prev}>‹</button> */}
      {/* <button className="slider-btn next" onClick={next}>›</button> */}

      {/* 👇 Navigation Dots (directly control slides) */}
      <div className="slider-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`dot ${i === current ? 'active' : ''}`}
            onClick={() => goToSlide(i)}
          />
        ))}
      </div>
    </div>
  );
};


const HomePage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState({});
  const [loading, setLoading] = useState(true);

  // 🖼️ Hardcoded category image list
  const categoryImages = [cat1, cat2, cat3, cat4, cat5, cat6];

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories', err);
    }
  };

  const fetchSubcategories = async (catId) => {
    if (subcategories[catId]) return;
    try {
      const res = await fetch(`http://localhost:5000/api/subcategories/${catId}`);
      const data = await res.json();
      setSubcategories((prev) => ({ ...prev, [catId]: data }));
    } catch (err) {
      console.error('Error loading subcategories', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/products');
      const data = await res.json();
      setProducts(data.products);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const prices = [
    { label: "₹99", value: 99, maxPrice:99},
    { label: "₹299", value: 299, maxPrice:299},
    { label: "₹499", value: 499, maxPrice:499},
    { label: "₹699", value: 699, maxPrice:699},
    { label: "₹899", value: 899, maxPrice:899},
    { label: "₹1200", value: 1200, maxPrice:1200},
  ];


  const ageRanges = [
    { label: '0 - 18 Months', age: '0-18 Months', icon: img018, color: '#FFB6C1' },
    { label: '18 - 36 Months', age: '18-36 Months', icon: img1836, color: '#87CEEB' },
    { label: '3 - 5 Years', age: '3-5 Years', icon: img0305, color: '#DDA0DD' },
    { label: '5 - 7 Years', age: '5-7 Years', icon: img0507, color: '#F0E68C' },
    { label: '7 - 9 Years', age: '7-9 Years', icon: img0709, color: '#B0E0E6' },
    { label: '9 - 12 Years', age: '9-12 Years', icon: img0912, color: '#98FB98' },
    { label: '12+ Years', age: '12+ years', icon: img12, color: '#FFA07A' },
  ];
  

  const brands = [
    { name: "Casio", image: brandCasio },
    { name: "Picasso", image: brandClassmate },
    { name: "Linograph", image: brandDuracell },
    { name: "Mattel", image: brandHauser },
    { name: "Camel", image: brandCamel },
    { name: "Sakura", image: brandNataraj },
    { name: "Market", image: brandLinc },
    { name: "Apsara", image: brandApsara },
    { name: "ABRO", image: brandMontex },
    { name: "Parker", image: brandParker },
    { name: "paperkraft", image: brandPaperkraft },
    { name: "Pilot", image: brandPilot },
    { name: "Reynolds", image: brandReynolds },
    { name: "3M", image: brand3M },
  ];

  
  const characters = [
    { name: "Barbie", image: barbie },
    { name: "Mickey Mouse", image: mickey },
    { name: "Spider Man", image: spider },
    { name: "Peppa Pig",   image: pepa },
    { name: "Harry Potter", image: harry1 },
    { name: "Avengers", image: avengers },
    { name: "Disney Princess", image: disney },
    { name: "Forzon", image: forzon },
    { name: "Pokemon", image: pokeman },
  ];

  const slides = [
    {
      image: slide1,
      title: "New Arrivals!",
      subtitle: "Check out the latest products in our store.",
      cta: "Shop Now",
      onClick: () => navigate("/products"),
    },
    {
      image: slide2,
      title: "Mega Sale!",
      subtitle: "Up to 50% off on select items.",
      cta: "Grab Offers",
      onClick: () => navigate("/products/sale"),
    },
    {
      image: slide3,
      title: "Fast Delivery",
      subtitle: "Get your orders delivered within 24 hours.",
      cta: "Order Now",
      onClick: () => navigate("/products"),
    },
  ];

  return (
    <div>
      <Header/>
      <div className="home-page">
      

      <Slider slides={slides} />

      {/* Shop by Price */}
      <div className="shop-section">
        <h2 className="section-title">Shop by Price</h2>
        <div className="offer-grid">
          {prices.map((price, index) => (
            <div
              key={index}
              className="offer-card"
              onClick={() => navigate(`/products?price=0-${price.maxPrice}`)}
            >
              <h3>Under</h3>
              <h2>{price.label}</h2>
            </div>
          ))}
        </div>
      </div>

      {/* Shop by Age */}
      <div className="shop-section">
        <h2 className="section-title">Shop by Age</h2>
        <div className="age-grid">
          {ageRanges.map((age) => (
            <div key={age.age} className="age-card" onClick={() => navigate(`/products?age=${age.age}`)} style={{ background: age.color }}>
              <img src={age.icon} alt={age.label} className="age-icon" />
              <h3>{age.label}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Shop by Categories */}
      <div className="shop-section">
        <h2 className="section-title">Shop by Categories</h2>
        <div className="category-grid">
          {categories.slice(0, 6).map((cat, index) => (
            <div
              key={cat.sno}
              className="category-card"
              onClick={() => navigate(`/products?category=${cat.sno}`)}
            >
              <img
                src={categoryImages[index % categoryImages.length]}
                alt={cat.category_name}
                className="category-img"
              />
              <h3>{cat.category_name}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Shop by Brands */}
      {/* <div className="shop-section">
        <h2 className="section-title">Shop by Brands</h2>
        <div className="brand-grid">
          {brands.map((brand) => (
            <div key={brand.name} className="brand-card" onClick={() => navigate(`/products?brand=${brand.name}`)}>
              <div className="brand-icon" style={{ background: brand.color }}>{brand.icon}</div>
              <h3>{brand.name}</h3>
            </div>
          ))}
        </div>
      </div> */}

<div className="shop-section">
        <h2 className="section-title">Explore by Brand</h2>
        <div className="brand-carousel">
          <button
            className="brand-arrow left"
            onClick={() =>
              document.getElementById("brandScroll").scrollBy({ left: -300, behavior: "smooth" })
            }
          >
            &#8249;
          </button>

          <div className="brand-scroll" id="brandScroll">
            {brands.map((brand) => (
              <div
                key={brand.name}
                className="brand-item"
                onClick={() => navigate(`/products?brand=${brand.name}`)}
              >
                <img src={brand.image} alt={brand.name} />
              </div>
            ))}
          </div>  

          <button
            className="brand-arrow right"
            onClick={() =>
              document.getElementById("brandScroll").scrollBy({ left: 300, behavior: "smooth" })
            }
          >
            &#8250;
          </button>
        </div>
      </div>

      {/* Trending Categories */}
      <div className="shop-section">
        <h2 className="section-title">Trending Categories</h2>
        <div className="trending-grid">
          {categories.slice(0, 4).map((cat, index) => (
            <div
              key={cat.sno}
              className="trending-card"
              onClick={() => navigate(`/products?category=${cat.sno}`)}
            >
              <img
                src={categoryImages[index % categoryImages.length]}
                alt={cat.category_name}
                className="trending-img"
              />
              <div className="trending-badge"></div>
              <h3>{cat.category_name}</h3>
              <p>Shop Now →</p>
            </div>
          ))}
        </div>
      </div>

      {/* Shop by Character */}
      {/* <div className="shop-section">
        <h2 className="section-title">Shop by Character or Theme</h2>
        <div className="character-grid">
          {characters.map((char) => (
            <div key={char.name} className="character-card" onClick={() => navigate(`/products?theme=${char.name}`)}>
              <div className="character-icon" style={{ background: char.color }}>{char.icon}</div>
              <h3>{char.name}</h3>
            </div>
          ))}
        </div>
      </div> */}
      <div className="shop-section">
        <h2 className="section-title">Shop by Character or Theme</h2>
        <div className="character-carousel">
          <button
            className="character-arrow left"
            onClick={() =>
              document.getElementById("characterScroll").scrollBy({ left: -300, behavior: "smooth" })
            }
          >
            &#8249;
          </button>

          <div className="character-scroll" id="characterScroll">
            {characters.map((char) => (
              <div key={char.name} className="character-item" onClick={() => navigate(`/products?brand=${char.name}`)}>
                <img src={char.image} alt={char.name} />
                <p>{char.name}</p>
              </div>
            ))}
          </div>

          <button
            className="character-arrow right"
            onClick={() =>
              document.getElementById("characterScroll").scrollBy({ left: 300, behavior: "smooth" })
            }
          >
            &#8250;
          </button>
        </div>
      </div>

      <Footer />
      </div>
    </div>
  );
};

export default HomePage;
