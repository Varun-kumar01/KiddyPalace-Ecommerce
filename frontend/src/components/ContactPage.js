import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import './ContactPage.css';

const ContactPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <>
      <Header />
      <div className="contact-page">
        <div className="contact-container">
          <div className="contact-header">
            <h1>Get In Touch</h1>
            <p>We'd love to hear from you! Send us a message and we'll respond as soon as possible.</p>
          </div>

          <div className="contact-content">
            <div className="contact-info">
              <div className="info-card">
                <div className="info-icon">📍</div>
                <h3>Address</h3>
                <p>123 E-Commerce Street<br />Business District<br />Mumbai, India 400001</p>
              </div>

              <div className="info-card">
                <div className="info-icon">📞</div>
                <h3>Phone</h3>
                <p>+91 98765 43210<br />+91 98765 43211</p>
              </div>

              <div className="info-card">
                <div className="info-icon">✉️</div>
                <h3>Email</h3>
                <p>support@ecommerce.com<br />sales@ecommerce.com</p>
              </div>

              <div className="info-card">
                <div className="info-icon">🕒</div>
                <h3>Working Hours</h3>
                <p>Monday - Friday: 9:00 AM - 6:00 PM<br />Saturday: 10:00 AM - 4:00 PM<br />Sunday: Closed</p>
              </div>
            </div>

            <div className="contact-form-section">
              {submitted ? (
                <div className="success-message">
                  <div className="success-icon">✓</div>
                  <h2>Thank You!</h2>
                  <p>Your message has been sent successfully. We'll get back to you soon!</p>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Full Name *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Enter your name"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="subject">Subject *</label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        placeholder="What is this about?"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="6"
                      placeholder="Write your message here..."
                    ></textarea>
                  </div>

                  <button type="submit" className="submit-btn">
                    <span>Send Message</span>
                    <div className="ripple"></div>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
