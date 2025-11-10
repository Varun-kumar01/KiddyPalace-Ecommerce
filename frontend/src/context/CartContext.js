import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  // Initialize cart synchronously from localStorage to avoid a flash/overwrite
  const getInitialCart = () => {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.error('Error reading cart from localStorage during init:', err);
      try {
        localStorage.removeItem('cart');
      } catch (e) {}
    }
    return [];
  };

  const [cartItems, setCartItems] = useState(getInitialCart);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cartItems]);

  // Helper to normalize product shape so stored items are consistent and serializable
  const normalizeProduct = (p) => {
    const id = p.id ?? p.sno ?? p.product_id ?? '${Date.now()}-${Math.random()}';
    return {
      id,
      name: p.name ?? p.product_name ?? '',
      price: Number(p.price ?? p.mrp ?? 0) || 0,
      image: p.image ?? (Array.isArray(p.images) ? p.images[0] : '') ?? '',
      stock_quantity: p.stock_quantity ?? p.stock_qty ?? p.stock ?? 999,
      description: p.description ?? '',
      // keep any other useful fields
      ...p,
    };
  };

  const addToCart = (product, quantity = 1) => {
    const prod = normalizeProduct(product);
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === prod.id);

      if (existingItem) {
        // Update quantity if item already in cart
        return prevItems.map((item) =>
          item.id === prod.id
            ? { ...item, quantity: (Number(item.quantity) || 0) + Number(quantity) }
            : item
        );
      } else {
        // Add new item to cart
        return [...prevItems, { ...prod, quantity: Number(quantity) }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};