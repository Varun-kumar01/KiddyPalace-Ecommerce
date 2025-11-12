import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import HomePage from './components/HomePage';
import SignupPage from './components/SignupPage';
import LoginPage from './components/LoginPage';
import AdminPage from './components/AdminPage';
import AdminLogin from './components/AdminLogin';
import ProductsPage from './components/ProductsPage';
import CartPage from './components/CartPage';
import CheckoutPage from './components/CheckoutPage';
import PaymentPage from './components/PaymentPage';
import OrderConfirmationPage from './components/OrderConfirmationPage';
import ContactPage from './components/ContactPage';
import './App.css';
import ProductDetails from './components/ProductDetails';
import GiftCardDetails from './components/GiftCardDetails';
import OrdersPage from './components/OrdersPage';

function App() {
  return (
    <CartProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/giftcards/:id" element={<GiftCardDetails />} />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
