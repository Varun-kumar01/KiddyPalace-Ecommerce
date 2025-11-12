import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const prevUserIdRef = useRef(null);

  const getUserIdFromLocalStorage = () => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Prefer stable id field; fallback to email
      return parsed?.id ?? parsed?.userId ?? parsed?.email ?? null;
    } catch {
      return null;
    }
  };

  const getCartStorageKey = (userId) => {
    return userId ? `cart:${String(userId)}` : 'cart:guest';
  };

  // Determine current user at startup
  useEffect(() => {
    const userId = getUserIdFromLocalStorage();
    setCurrentUserId(userId);
  }, []);

  // Respond to user changes (custom event + storage event)
  useEffect(() => {
    const onUserChanged = () => {
      const userId = getUserIdFromLocalStorage();
      setCurrentUserId(userId);
    };
    window.addEventListener('user-changed', onUserChanged);
    window.addEventListener('storage', (e) => {
      if (e.key === 'user') onUserChanged();
    });
    return () => {
      window.removeEventListener('user-changed', onUserChanged);
    };
  }, []);

  // Load cart when user changes
  useEffect(() => {
    if (prevUserIdRef.current === currentUserId) return;
    prevUserIdRef.current = currentUserId;
    try {
      const key = getCartStorageKey(currentUserId);
      const savedCart = localStorage.getItem(key);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(Array.isArray(parsedCart) ? parsedCart : []);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, [currentUserId]);

  // Save cart to localStorage whenever it changes for the current user key
  useEffect(() => {
    try {
      const key = getCartStorageKey(currentUserId);
      localStorage.setItem(key, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cartItems, currentUserId]);

  const addToCart = (product, quantity = 1) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      
      if (existingItem) {
        // Update quantity if item already in cart
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item to cart
        return [...prevItems, { ...product, quantity }];
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
    try {
      const key = getCartStorageKey(currentUserId);
      localStorage.removeItem(key);
    } catch (e) {
      // no-op
    }
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
