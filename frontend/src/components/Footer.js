import React from "react";
import "./Footer.css";

const Footer = () => (
  <footer className="footer">
    <div className="footer-container">
      <div className="footer-content">
        {/* Info Section */}
        <div className="footer-section">
          <h3>Info</h3>
          <ul>
            <li><a href="#about">About Us</a></li>
            <li><a href="#stores">Stores</a></li>
            <li><a href="https://www.aarcaai.com" target="_blank" rel="noopener noreferrer">Loyalty Program</a></li>
            <li><a href="#gift-cards">Gift Cards</a></li>
            <li><a href="#careers">Careers</a></li>
            <li><a href="#blogs">Blogs</a></li>
            <li><a href="#workshops">Workshops</a></li>
          </ul>
        </div>

        {/* Quick Links Section */}
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="#new-arrivals">New Arrivals</a></li>
            <li><a href="#trending">Trending Products</a></li>
            <li><a href="https://99wholesale.com" target="_blank" rel="noopener noreferrer">FAQs (99Wholesale)</a></li>
            <li><a href="#corporate">Corporate & Bulk Purchasing</a></li>
          </ul>
        </div>

        {/* Policies Section */}
        <div className="footer-section">
          <h3>Policies</h3>
          <ul>
            <li><a href="#terms">Terms & Conditions</a></li>
            <li><a href="#disclaimer">Disclaimer</a></li>
            <li><a href="#privacy">Privacy Policy</a></li>
            <li><a href="#refund">Refund & Cancellation Policy</a></li>
            <li><a href="#shipping">Shipping Policy</a></li>
          </ul>
        </div>

        {/* Contact Us Section */}
        <div className="footer-section">
          <h3>Contact Us</h3>
          <ul className="contact-list">
            <li>📞 <a href="tel:+919876543210">+91 98765 43210</a></li>
            <li>📧 <a href="mailto:support@ecommerce.com">support@ecommerce.com</a></li>
            <li>📍 123, Main Street, Hyderabad, India</li>
          </ul>
          <div className="social-links">
            <a href="#facebook" aria-label="Facebook">📘</a>
            <a href="#twitter" aria-label="Twitter">🐦</a>
            <a href="#instagram" aria-label="Instagram">📷</a>
            <a href="#youtube" aria-label="YouTube">📺</a>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} kiddypalace. All rights reserved.</p>
        <div className="payment-methods">
          <span>We Accept:</span>
          <span className="payment-icon">💳</span>
          <span className="payment-icon">🔵</span>
          <span className="payment-icon">📱</span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
