import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback, // ✅ <-- add this import
} from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  // ✅ Initialize cart from localStorage
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

  // ✅ Persist cart updates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cartItems]);

  // ✅ Normalize product structure for consistent cart data
  const normalizeProduct = (p) => {
    const id = p.id ?? p.sno ?? p.product_id ?? `${Date.now()}-${Math.random()}`;
    return {
      id,
      name: p.name ?? p.product_name ?? '',
      price: Number(p.price ?? p.mrp ?? 0) || 0,
      image: p.image ?? (Array.isArray(p.images) ? p.images[0] : '') ?? '',
      stock_quantity: p.stock_quantity ?? p.stock_qty ?? p.stock ?? 999,
      description: p.description ?? '',
      ...p,
    };
  };

  // ✅ Add to Cart
  const addToCart = (product, quantity = 1) => {
    const prod = normalizeProduct(product);
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === prod.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === prod.id
            ? { ...item, quantity: (Number(item.quantity) || 0) + Number(quantity) }
            : item
        );
      } else {
        return [...prevItems, { ...prod, quantity: Number(quantity) }];
      }
    });
  };

  // ✅ Remove item
  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  // ✅ Update item quantity
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

  // ✅ Clear cart (memoized)
  const clearCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem('cart');
  }, []);

  // ✅ Cart total and count helpers
  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + (Number(item.quantity) || 0), 0);
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
