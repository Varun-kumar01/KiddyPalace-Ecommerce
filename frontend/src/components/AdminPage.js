import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import "./AdminPage.css";
import axios from "axios";

const AdminPage = () => {
  const navigate = useNavigate();


   // ✅ State declarations
  const [products, setProducts] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("add");
  const [adminUser, setAdminUser] = useState(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [excelFile, setExcelFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [ordersStatusFilter, setOrdersStatusFilter] = useState('all');
  

  // Popup
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', kind: 'success' });
  const showToast = (message, kind = 'success', duration = 1200) => {
    setToast({ show: true, message, kind });
    setTimeout(() => setToast({ show: false, message: '', kind }), duration);
  };
  const [confirmState, setConfirmState] = useState({
    open: false,
    message: '',
    onConfirm: null,
  });
  const askConfirm = (message, onConfirm) => {
    setConfirmState({ open: true, message, onConfirm });
  };
  const handleConfirmYes = () => {
    const fn = confirmState.onConfirm;
    setConfirmState({ open: false, message: '', onConfirm: null });
    if (typeof fn === 'function') fn();
  };
  const handleConfirmNo = () => {
    setConfirmState({ open: false, message: '', onConfirm: null });
  };

  
// Bulk upload states
const [bulkFile, setBulkFile] = useState(null);
const [bulkMessage, setBulkMessage] = useState("");
const [bulkLoading, setBulkLoading] = useState(false);

// Handle bulk upload
const handleBulkUpload = async (e) => {
  e.preventDefault();
  if (!bulkFile) {
    setBulkMessage("⚠️ Please select an Excel file first.");
    return;
  }

  const formData = new FormData();
  formData.append("file", bulkFile);

  try {
    setBulkLoading(true);
    setBulkMessage("Uploading... ⏳");

    const response = await axios.post("http://localhost:5000/api/upload-excel", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setBulkMessage(`✅ ${response.data.message || "Products uploaded successfully!"}`);
  } catch (error) {
    console.error(error);
    const serverMsg =
      error.response?.data?.message ||
      (Array.isArray(error.response?.data?.missing_headers)
        ? `Missing headers: ${error.response.data.missing_headers.join(', ')}`
        : null);
    setBulkMessage(`❌ ${serverMsg || "Error uploading Excel file. Please check your format."}`);
  } finally {
    setBulkLoading(false);
  }
};

 // ✅ Billing state
  const [billItems, setBillItems] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedBillingProduct, setSelectedBillingProduct] = useState("");
  const [billingQuantity, setBillingQuantity] = useState(1);
  // Quick add to bag quantities per product in Manage tab
  const [quickAddQty, setQuickAddQty] = useState({});
  
  // New product form state
 const [newProduct, setNewProduct] = useState({
  product_name: '',
  product_price: '',
  product_brand: '',
  product_description: '',
  age_range: '',
  gender: '',
  specifications: '',
  product_details: '',
  brand_name: '',
  product_highlights: '',
  category_id: '',
  subcategory_id: '',
  stock_quantity: ''
});

  const [newProductImages, setNewProductImages] = useState([]);
  
  // Edit stock state
  const [editingProductId, setEditingProductId] = useState(null);
  const [editStockValue, setEditStockValue] = useState('');

  useEffect(() => {
  const storedUser = localStorage.getItem('user');
  const token = localStorage.getItem('token');

  if (!storedUser || !token) {
    navigate('/login');
    return;
  }

  const parsedUser = JSON.parse(storedUser);
  if (parsedUser.role !== 'super_admin') {
    navigate('/');
    return;
  }

  setAdminUser(parsedUser);
  setIsVerifying(false);
  fetchProducts();
}, [navigate]);




  
//const [categories, setCategories] = useState([]);
//const [subcategories, setSubcategories] = useState([]);
useEffect(() => {
  fetch('http://localhost:5000/api/categories')
    .then(res => res.json())
    .then(data => setCategories(data));
}, []);

const handleCategoryChange = (e) => {
  const categoryId = e.target.value;
  setNewProduct({ ...newProduct, category_id: categoryId });

  // fetch subcategories
  fetch(`http://localhost:5000/api/categories/${categoryId}/subcategories`)
    .then(res => res.json())
    .then(data => setSubcategories(data));
};





  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await fetch('http://localhost:5000/api/products?showAll=true');
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products);
        console.log('Products loaded:', data.products);
      } else {
        setMessage('Failed to load products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage('Error connecting to server. Make sure backend is running.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) {
      setSelectedFiles([]);
    const file = e.target.files[0];
    // if (file) {
    //   Check file size (2MB = 2 * 1024 * 1024 bytes)
    //   if (file.size > 2 * 1024 * 1024) {
    //     showToast('File size must be less than 2MB. Please choose a smaller image.', 'warn', 1600);
    //     setSelectedFile(null);
    //     e.target.value = '';
    //     return;
    //   }
    //   setSelectedFile(file);
    //   setMessage('');
    //   return;
    // }

    const MAX_FILES = 5;
    let infoMessage = '';

    if (files.length > MAX_FILES) {
      infoMessage = `You can upload a maximum of ${MAX_FILES} images at a time.`;
    }

    const selected = files.slice(0, MAX_FILES);
    const oversized = selected.find((file) => file.size > 2 * 1024 * 1024);

    if (oversized) {
      setMessage('Each image must be less than 2MB.');
      e.target.value = '';
      setSelectedFiles([]);
      return;
    }

    setSelectedFiles(selected);
    setMessage(infoMessage);
  };

  const handleProductSelect = (e) => {
    setSelectedProductId(e.target.value);
    setMessage('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (selectedFiles.length === 0 || !selectedProductId) {
      setMessage('Please select both a product and an image file');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    if (selectedFiles.length > 0) {
      selectedFiles.forEach((file) => formData.append('images', file));
      formData.append('primaryImageIndex', '0');
    }
    try {
      const response = await fetch(`http://localhost:5000/api/products/${selectedProductId}/image`, {
        method: 'PUT',
        body: formData,
      });

      // const data = await response.json();

      let responseBody = '';
      let data = '' ;  

      try {
        responseBody = await response.text();
        data = responseBody ? JSON.parse(responseBody) : null;
      } catch (parseError) {
        console.warn('Unable to parse upload response as JSON:', parseError);
      }

      if (response.ok && data?.success) {
        setPopupMessage('Image uploaded successfully!');
        setShowPopup(true);
        // Hide popup after 1 seconds
        setTimeout(() => setShowPopup(false), 1000);
        setSelectedFiles([]);
        setSelectedProductId('');
        setMessage('');
        // Refresh products
        fetchProducts();
        // Reset file input
        document.getElementById('file-input').value = '';
      } else {
        const errorMessage = data?.message || responseBody || 'Failed to upload image';
        setMessage(errorMessage);
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Error uploading image', 'error', 1600);
    } finally {
      setLoading(false);
    }
  };

  // Handle new product form changes
  const handleNewProductChange = (e) => {
    setNewProduct({
      ...newProduct,
      [e.target.name]: e.target.value,
    });
  };

  const handleNewProductImageChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) {
      setNewProductImages([]);
      setMessage('');
      return;
    }

    const MAX_FILES = 5;
    let infoMessage = '';

    if (files.length > MAX_FILES) {
      infoMessage = `You can upload a maximum of ${MAX_FILES} images per product.`;
    }

    const selectedFiles = files.slice(0, MAX_FILES);
    const oversized = selectedFiles.find((file) => file.size > 2 * 1024 * 1024);

    if (oversized) {
      setMessage('Each image must be less than 2MB.');
      e.target.value = '';
      setNewProductImages([]);
      return;
    }

    setNewProductImages(selectedFiles);
    setMessage(infoMessage);
  };

 const handleAddProduct = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const formData = new FormData();
      formData.append('name', newProduct.product_name);
    formData.append('description', newProduct.product_description || '');
    formData.append('price', newProduct.product_price);
    formData.append('category_id', newProduct.category_id || null);
    formData.append('subcategory_id', newProduct.subcategory_id || null);
    formData.append('stock_quantity', newProduct.stock_quantity || 0);
    formData.append('age_range', newProduct.age_range || '');
    formData.append('gender', newProduct.gender || '');
    formData.append('highlights', newProduct.product_highlights || '');
    formData.append('specifications', newProduct.specifications || '');
    formData.append('product_details', newProduct.product_details || '');
    formData.append('brand_name', newProduct.brand_name || '');

    if (newProductImages.length > 0) {
      newProductImages.forEach((file) => {
        formData.append('images', file);
      });
    }

    const response = await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'Failed to add product');

    showToast('✅ Product added successfully!', 'success', 1200);
    setNewProduct({
      product_name: '',
      product_price: '',
      product_brand: '',
      product_description: '',
      age_range: '',
      gender: '',
      specifications: '',
      product_details: '',
      brand_name: '',
      product_highlights: '',
      category_id: '',
      subcategory_id: '',
      stock_quantity: ''
    });
    setNewProductImages([]);
    document.getElementById('product_image').value = '';
    fetchProducts();
  } catch (error) {
    console.error('Error adding product:', error);
    showToast('❌ Error adding product: ' + error.message, 'error', 1600);
  } finally {
    setLoading(false);
  }
};

// Gift Card States
const [newGiftCard, setNewGiftCard] = useState({
  title: '',
  brand: '',
  sku: '',
  base_price: '',
  price_options: '',
  description: ''
});
const [giftCardImages, setGiftCardImages] = useState([]);

// Handle form input changes
const handleGiftCardChange = (e) => {
  setNewGiftCard({ ...newGiftCard, [e.target.name]: e.target.value });
};

// Handle image change
const handleGiftCardImageChange = (e) => {
  const files = Array.from(e.target.files || []);
  const valid = files.filter(f => f.size <= 2 * 1024 * 1024);
  if (valid.length !== files.length) {
    showToast("Each image must be less than 2MB", 'warn', 1600);
  }
  setGiftCardImages(valid);
};

// Handle Gift Card submit
const handleAddGiftCard = async (e) => {
  e.preventDefault();
  if (!giftCardImages || giftCardImages.length === 0) {
    showToast("Please upload at least one image", 'warn', 1600);
    return;
  }

  try {
    setLoading(true);
    const formData = new FormData();
    formData.append("title", newGiftCard.title);
    formData.append("brand", newGiftCard.brand);
    formData.append("sku", newGiftCard.sku);
    formData.append("base_price", newGiftCard.base_price);
    formData.append("price_options", newGiftCard.price_options);
    formData.append("description", newGiftCard.description);
    giftCardImages.forEach((file) => formData.append("images", file));

    const response = await axios.post("http://localhost:5000/api/giftcards", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (response.data.success) {
      showToast("🎁 Gift Card added successfully!", 'success', 1200);
      setNewGiftCard({
        title: '',
        brand: '',
        sku: '',
        base_price: '',
        price_options: '',
        description: ''
      });
      setGiftCardImages([]);
      // Refresh available gift cards below
      fetchGiftCards();
    } else {
      showToast(response.data.message || "Failed to add gift card", 'error', 1600);
    }
  } catch (error) {
    console.error("Gift Card Error:", error);
    showToast("Error adding gift card", 'error', 1600);
  } finally {
    setLoading(false);
  }
};


// 🎁 Manage Gift Cards State
const [giftCards, setGiftCards] = useState([]);
const [loadingGiftCards, setLoadingGiftCards] = useState(false);

// Fetch all gift cards
const fetchGiftCards = async () => {
  try {
    setLoadingGiftCards(true);
    const response = await axios.get("http://localhost:5000/api/giftcards");
    if (response.data.success) {
      setGiftCards(response.data.giftcards);
    } else {
      console.error("Failed to fetch gift cards");
    }
  } catch (error) {
    console.error("Error fetching gift cards:", error);
  } finally {
    setLoadingGiftCards(false);
  }
};

// Delete a gift card
const handleDeleteGiftCard = (id) => {
  askConfirm("Are you sure you want to delete this gift card?", async () => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/giftcards/${id}`);
      if (response.data.success) {
        showToast("Gift Card deleted successfully!", 'success', 1200);
        fetchGiftCards();
      } else {
        showToast(response.data.message || "Failed to delete gift card", 'error', 1600);
      }
    } catch (error) {
      console.error("Error deleting gift card:", error);
      showToast("Error deleting gift card", 'error', 1600);
    }
  });
};

// Load gift cards when Add Gift Card tab is active (so list shows below form)
useEffect(() => {
  if (activeTab === "giftcard") {
    fetchGiftCards();
  }
}, [activeTab]);

// Fetch all customer orders (no admin token required)
const fetchAdminOrders = async (status = ordersStatusFilter) => {
  setLoadingOrders(true);
  setOrdersError("");
  try {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`http://localhost:5000/api/orders${query}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Check if response is JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error('Server returned invalid response. Please check the server logs.');
    }

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || `Failed to load orders: ${res.status} ${res.statusText}`);
    }
    
    setAdminOrders(Array.isArray(data.orders) ? data.orders : []);
  } catch (err) {
    console.error('Error fetching orders:', err);
    setOrdersError(err.message || 'Unable to fetch orders right now.');
  } finally {
    setLoadingOrders(false);
  }
};

// Load orders when Orders tab becomes active
useEffect(() => {
  if (activeTab === 'orders') {
    fetchAdminOrders();
  }
}, [activeTab]);

// Refetch when filter changes while on orders tab
useEffect(() => {
  if (activeTab === 'orders') {
    fetchAdminOrders(ordersStatusFilter);
  }
}, [ordersStatusFilter]);

const handleAcceptOrder = (orderId) => {
  askConfirm('Are you sure you want to accept this order?', async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned invalid response. Please check the server logs.');
      }

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || `Failed to accept order: ${res.status} ${res.statusText}`);
      }
      
      showToast('✅ Order accepted successfully! Status changed from pending to accepted.', 'success', 2000);
      // Refresh orders to show updated status
      fetchAdminOrders();
    } catch (err) {
      console.error('Error accepting order:', err);
      showToast(err.message || 'Could not accept the order. Please try again later.', 'error', 2000);
    }
  });
};

  // Logout function
  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (!confirmLogout) return;

    try {
      const adminToken = localStorage.getItem('adminToken');
      
      if (adminToken) {
        await fetch('http://localhost:5000/api/admin/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      navigate('/');
    }
  };

  // Update stock quantity
  const handleUpdateStock = async (productId) => {
    if (!editStockValue || editStockValue < 0) {
      setMessage('Please enter a valid stock quantity');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stock_quantity: parseInt(editStockValue) }),
      });

      const data = await response.json();

      if (data.success) {
         // Set popup instead of just message
        setPopupMessage(`✅ Stock updated successfully to ${editStockValue} units!`);
        setShowPopup(true);

        // Hide popup after 2 seconds
      setTimeout(() => setShowPopup(false), 2000);

        setEditingProductId(null);
        setEditStockValue('');
        fetchProducts();
      } else {
        setMessage(data.message || 'Failed to update stock');
      }
    } catch (error) {
      console.error('Update stock error:', error);
      setMessage('Error updating stock');
    }
  };

  const startEditingStock = (productId, currentStock) => {
    setEditingProductId(productId);
    setEditStockValue(currentStock);
  };

  const cancelEditingStock = () => {
    setEditingProductId(null);
    setEditStockValue('');
  };

  // Delete product
  const handleDeleteProduct = (productId) => {
    askConfirm('Are you sure you want to delete this product?', async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (data.success) {
          showToast('Product deleted successfully!', 'success', 1200);
          fetchProducts();
        } else {
          showToast(data.message || 'Failed to delete product', 'error', 1600);
        }
      } catch (error) {
        console.error('Delete error:', error);
        showToast('Error deleting product', 'error', 1600);
      }
    });
  };

  // Billing functions
  const handleAddToBill = () => {
    if (!selectedBillingProduct || billingQuantity <= 0) {
      setMessage('Please select a product and enter quantity');
      return;
    }

    const product = products.find(p => p.id === parseInt(selectedBillingProduct));
    if (!product) {
      setMessage('Product not found');
      return;
    }

    if (billingQuantity > product.stock_quantity) {
      setMessage(`Only ${product.stock_quantity} items available in stock`);
      return;
    }

    // Check if product already in bill
    const existingItemIndex = billItems.findIndex(item => item.id === product.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity
      const updatedItems = [...billItems];
      updatedItems[existingItemIndex].quantity += billingQuantity;
      setBillItems(updatedItems);
    } else {
      // Add new item
      setBillItems([...billItems, {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: billingQuantity,
      }]);
    }

    setSelectedBillingProduct('');
    setBillingQuantity(1);
    setMessage('');
  };

  // Quick add to bag from Manage tab card
  const handleQuickAddToBill = (productId) => {
    const qty = parseInt(quickAddQty[productId] ?? 1, 10);
    if (!qty || qty <= 0) {
      setMessage('Please enter a valid quantity');
      return;
    }

    const product = products.find(p => p.id === parseInt(productId));
    if (!product) {
      setMessage('Product not found');
      return;
    }

    if (qty > product.stock_quantity) {
      setMessage(`Only ${product.stock_quantity} items available in stock`);
      return;
    }

    const existingItemIndex = billItems.findIndex(item => item.id === product.id);
    if (existingItemIndex >= 0) {
      const updatedItems = [...billItems];
      updatedItems[existingItemIndex].quantity += qty;
      setBillItems(updatedItems);
    } else {
      setBillItems([...billItems, {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: qty,
      }]);
    }

    setQuickAddQty(prev => ({ ...prev, [productId]: 1 }));
    setMessage('');
    setPopupMessage('Added to bag');
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 800);
  };

  const handleRemoveFromBill = (productId) => {
    setBillItems(billItems.filter(item => item.id !== productId));
  };

  const handleUpdateBillQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromBill(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stock_quantity) {
      setMessage(`Only ${product.stock_quantity} items available in stock`);
      return;
    }

    setBillItems(billItems.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const calculateBillTotal = () => {
    const subtotal = billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // const gst = subtotal * 0.18;
    const total = subtotal;
    return { subtotal, total };
  };

  const handlePrintBill = () => {
    if (billItems.length === 0) {
      setMessage('Add items to the bill first');
      return;
    }

    const { subtotal, total } = calculateBillTotal();
    const billDate = new Date().toLocaleString();

    // Create print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - Kiddy Palace</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
          }
          .bill-header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .bill-info {
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
          }
          th {
            background-color: #f4f4f4;
          }
          .text-right {
            text-align: right;
          }
          .total-section {
            margin-left: auto;
            width: 300px;
            border-top: 2px solid #333;
            padding-top: 10px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
          }
          .grand-total {
            font-weight: bold;
            font-size: 1.2em;
            border-top: 2px solid #333;
            margin-top: 10px;
            padding-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 0.9em;
          }
          @media print {
            body {
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="bill-header">
          <h1>Kiddy Palace STORE</h1>
          <p>Tax Invoice</p>
        </div>
        
        <div class="bill-info">
          <p><strong>Date:</strong> ${billDate}</p>
          ${customerName ? `<p><strong>Customer:</strong> ${customerName}</p>` : ''}
          ${customerPhone ? `<p><strong>Phone:</strong> ${customerPhone}</p>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Product Name</th>
              <th class="text-right">Price (₹)</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${billItems.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td class="text-right">₹${item.price.toFixed(2)}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">₹${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${subtotal.toFixed(2)}</span>
          </div>
         
          <div class="total-row grand-total">
            <span>Total Amount:</span>
            <span>₹${total.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>*** This is a computer generated invoice ***</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleClearBill = () => {
    if (billItems.length > 0 && !window.confirm('Are you sure you want to clear the bill?')) {
      return;
    }
    setBillItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setMessage('');
  };

  // Show loading while verifying authentication
  if (isVerifying) {
    return (
      <div className="admin-page">
        <Header />
        <main className="admin-content">
          <div className="admin-loading">
            <div className="loading-spinner"></div>
            <p>Verifying admin access...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Header />
      <main className="admin-content">
        <div className="admin-container">
          <div className="admin-header">
            <div>
              <h1>Admin Dashboard</h1>
              {adminUser && (
                <p className="admin-welcome">Welcome, {adminUser.full_name} ({adminUser.role})</p>
              )}
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="tab-navigation">
  <button 
    className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
    onClick={() => { setActiveTab('add'); setMessage(''); }}
  >
    ➕ Add New Product
  </button>

  <button 
    className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
    onClick={() => { setActiveTab('upload'); setMessage(''); }}
  >
    📸 Upload Product Images
  </button>

  <button 
    className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
    onClick={() => { setActiveTab('manage'); setMessage(''); }}
  >
    📦 Manage Products
  </button>

  <button 
    className={`tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
    onClick={() => { setActiveTab('billing'); setMessage(''); }}
  >
    💳 Billing (POS)
  </button>

  {/* ✅ New Gift Card Tab */}
  <button 
    className={`tab-btn ${activeTab === 'giftcard' ? 'active' : ''}`}
    onClick={() => { setActiveTab('giftcard'); setMessage(''); }}
  >
    🎁 Add Gift Card
  </button>

  <button 
    className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
    onClick={() => { setActiveTab('orders'); setMessage(''); }}
  >
    📬 Orders
  </button>
</div>


          {message && (
            <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

                   {/* Add New Product Tab */}
                   {activeTab === 'add' && (
            <div className="tab-content">
              <h2>Add New Product</h2>
              <form onSubmit={handleAddProduct} className="product-form">

                {/* Product Name */}
                <div className="form-group">
                  <label htmlFor="product_name">Product Name *</label>
                  <input
                    type="text"
                    id="product_name"
                    name="product_name"
                    value={newProduct.product_name}
                    onChange={handleNewProductChange}
                    placeholder="e.g., Building Blocks Set"
                    required
                  />
                </div>

                {/* Category & Subcategory */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="category_id">Category *</label>
                    <select
                      id="category_id"
                      name="category_id"
                      value={newProduct.category_id || ''}
                      onChange={handleCategoryChange}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.sno} value={cat.sno}>{cat.category_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="subcategory_id">Subcategory *</label>
                    <select
                      id="subcategory_id"
                      name="subcategory_id"
                      value={newProduct.subcategory_id || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, subcategory_id: e.target.value })}
                      required
                    >
                      <option value="">Select Subcategory</option>
                      {subcategories.map(sub => (
                        <option key={sub.sno} value={sub.sno}>{sub.subcategory_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Descriptions and Details */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="product_description">Description</label>
                    <textarea
                      id="product_description"
                      name="product_description"
                      value={newProduct.product_description}
                      onChange={handleNewProductChange}
                      placeholder="Enter product description..."
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="product_highlights">Product Highlights</label>
                    <textarea
                      id="product_highlights"
                      name="product_highlights"
                      value={newProduct.product_highlights}
                      onChange={handleNewProductChange}
                      placeholder="Enter product highlights..."
                      rows="3"
                    />
                  </div>

                  {/* <div className="form-group">
                    <label htmlFor="product_details">Product Details</label>
                    <textarea
                      id="product_details"
                      name="product_details"
                      value={newProduct.product_details}
                      onChange={handleNewProductChange}
                      placeholder="Enter product details..."
                      rows="3"
                    />
                  </div> */}

                  <div className="form-group">
                    <label htmlFor="specifications">Product Specifications</label>
                    <textarea
                      id="specifications"
                      name="specifications"
                      value={newProduct.specifications}
                      onChange={handleNewProductChange}
                      placeholder="Enter product specifications..."
                      rows="3"
                    />
                  </div>

                  {/* <div className="form-group">
                    <label htmlFor="brand_name">Brand Name</label>
                    <textarea
                      id="brand_name"
                      name="brand_name"
                      value={newProduct.brand_name}
                      onChange={handleNewProductChange}
                      placeholder="Enter additional details..."
                      rows="3"
                    />
                  </div> */}

                  <div className="form-group">
                    <label htmlFor="brand_name">Brand Name</label>
                    <select
                      id="brand_name"
                      name="brand_name"
                      value={newProduct.brand_name}
                      onChange={handleNewProductChange}
                    >
                      <option value="">Select Brand</option>
                      <option value="Picasso">Picasso</option>
                      <option value="Linograph">Linograph</option>
                      <option value="Mattel">Mattel</option>
                      <option value="Sakura">Sakura</option>
                      <option value="Market">Market</option>
                      <option value="Maped">Maped</option>
                      <option value="3M">3M</option>
                      <option value="Apsara">Apsara</option>
                      <option value="DELI">DELI</option>
                      <option value="Camel">Camel</option>
                      <option value="CASIO">CASIO</option>
                      <option value="ABRO">ABRO</option>
                    </select>
                  </div>
                </div>

                {/* Price, Stock, Age Range, Gender */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="product_price">Price (₹) *</label>
                    <input
                      type="number"
                      id="product_price"
                      name="product_price"
                      value={newProduct.product_price}
                      onChange={handleNewProductChange}
                      placeholder="999.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="stock_quantity">Stock Quantity *</label>
                    <input
                      type="number"
                      id="stock_quantity"
                      name="stock_quantity"
                      value={newProduct.stock_quantity}
                      onChange={handleNewProductChange}
                      placeholder="50"
                      min="0"
                      required
                    />
                  </div>

                  {/* <div className="form-group">
                    <label htmlFor="age_range">Age Range</label>
                    <input
                      type="text"
                      id="age_range"
                      name="age_range"
                      value={newProduct.age_range}
                      onChange={handleNewProductChange}
                      placeholder="3-8 years"
                    />
                  </div> */}

                  <div className="form-group">
                    <label htmlFor="age_range">Age Range</label>
                    <select
                      id="age_range"
                      name="age_range"
                      value={newProduct.age_range}
                      onChange={handleNewProductChange}
                    >
                      <option value="">Select Age Range</option>
                      <option value="0-18 Months">0-18 Months</option>
                      <option value="18-36 Months">18-36 Months</option>
                      <option value="3-5 Years">3-5 Years</option>
                      <option value="5-7 Years">5-7 Years</option>
                      <option value="7-9 Years">7-9 Years</option>
                      <option value="9-12 Years">9-12 Years</option>
                      <option value="12+ Years">12+ Years</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="gender">Gender</label>
                    <select
                      id="gender"
                      name="gender"
                      value={newProduct.gender || ''}
                      onChange={handleNewProductChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="Boys">Boys</option>
                      <option value="Girls">Girls</option>
                      <option value="unisex">Unisex</option>
                    </select>
                  </div>
                </div>

                
                {/* Product Image */}
                <div className="form-group">
                  <label htmlFor="product_image">Product Images (Optional, up to 5 files, max 2MB each)</label>
                  <input
                    type="file"
                    id="product_image"
                    accept="image/*"
                    multiple
                    onChange={handleNewProductImageChange}
                  />
                  {newProductImages.length > 0 && (
                    <div className="file-info">
                      <p>✓ Selected {newProductImages.length} image{newProductImages.length > 1 ? 's' : ''}:</p>
                      <ul>
                        {newProductImages.map((file, index) => (
                          <li key={`${file.name}-${index}`}>
                            {file.name} ({(file.size / 1024).toFixed(0)} KB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? '⏳ Adding Product...' : '➕ Add Product'}
                </button>

              </form>

              {/* Bulk Upload via Excel */}
              <div className="bulk-upload-section">
                <h3>📦 Bulk Upload via Excel</h3>
                <p className="bulk-info">
                  Upload multiple products at once using an Excel file (.xlsx or .xls)
                </p>

                <form onSubmit={handleBulkUpload} className="bulk-upload-form">
                  <label htmlFor="bulk-file" className="bulk-file-label">
                    {bulkFile ? bulkFile.name : "Choose Excel File"}
                  </label>
                  <input
                    id="bulk-file"
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={(e) => setBulkFile(e.target.files[0])}
                  />

                  <button type="submit" className="bulk-upload-btn" disabled={bulkLoading}>
                    {bulkLoading ? "Uploading..." : "Upload Excel"}
                  </button>
                </form>

                {bulkMessage && <p className="bulk-message">{bulkMessage}</p>}

                <div className="excel-format-box">
                  <h4>🧾 Excel Format Example:</h4>
                  <ul>
                    <li><b>Required Columns:</b> name, description, price, brand_name, category, subcategory_id, stock_quantity</li>
                    <li><b>Optional Columns:</b> age_range, gender, highlights, specifications</li>
                    <li>Images can be added later manually.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}


          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="tab-content">
              <h2>Customer Orders {adminOrders.length > 0 ? `(${adminOrders.length})` : ''}</h2>

              {/* Filters */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                margin: '12px 0 20px 0',
                flexWrap: 'wrap'
              }}>
                <label style={{ fontWeight: 600 }}>Filter by status:</label>
                <select
                  value={ordersStatusFilter}
                  onChange={(e) => setOrdersStatusFilter(e.target.value)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: 'white'
                  }}
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="accepted">Accepted</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {ordersStatusFilter !== 'all' && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      padding: '6px 12px',
                      background: '#eef2ff',
                      color: '#3730a3',
                      borderRadius: '999px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      {ordersStatusFilter}
                    </span>
                    <button
                      onClick={() => setOrdersStatusFilter('all')}
                      style={{
                        padding: '6px 10px',
                        border: '1px solid #e5e7eb',
                        background: 'white',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {loadingOrders && <div style={{ textAlign: 'center', padding: '40px' }}>Loading orders...</div>}
              {ordersError && !loadingOrders && <p style={{ color: 'red', padding: '20px' }}>{ordersError}</p>}

              {!loadingOrders && !ordersError && adminOrders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>No orders found.</p>
                </div>
              )}

              {!loadingOrders && !ordersError && adminOrders.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {adminOrders.map(order => {
                    const orderDate = order.created_at 
                      ? new Date(order.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Unknown date';

                    const statusColors = {
                      pending: '#f59e0b',
                      accepted: '#10b981',
                      processing: '#3b82f6',
                      shipped: '#8b5cf6',
                      delivered: '#059669',
                      cancelled: '#ef4444'
                    };

                    return (
                      <div 
                        key={order.id} 
                        style={{
                          background: 'rgba(255, 247, 235, 0.92)',
                          borderRadius: '12px',
                          padding: '24px',
                          border: '1px solid rgba(182, 158, 106, 0.25)',
                          boxShadow: '0 4px 12px rgba(39, 60, 46, 0.08)'
                        }}
                      >
                        {/* Order Header */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start',
                          marginBottom: '20px',
                          paddingBottom: '16px',
                          borderBottom: '2px solid rgba(182, 158, 106, 0.3)'
                        }}>
                          <div>
                            <h3 style={{ margin: '0 0 8px 0', color: '#273c2e', fontSize: '1.4rem' }}>
                              Order #{order.order_number}
                            </h3>
                            <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                              📅 Placed on: {orderDate}
                            </p>
                          </div>
                          <div style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            background: statusColors[order.order_status] || '#6b7280',
                            color: 'white',
                            fontWeight: '600',
                            textTransform: 'capitalize',
                            fontSize: '0.9rem'
                          }}>
                            {order.order_status || 'pending'}
                          </div>
                        </div>

                        {/* Customer Information */}
                        <div style={{ marginBottom: '20px' }}>
                          <h4 style={{ margin: '0 0 12px 0', color: '#273c2e', fontSize: '1.1rem' }}>
                            👤 Customer Information
                          </h4>
                          <div style={{ 
                            background: 'white', 
                            padding: '16px', 
                            borderRadius: '8px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '12px'
                          }}>
                            <div>
                              <strong>Name:</strong> {order.shipping_full_name || 'N/A'}
                            </div>
                            <div>
                              <strong>Email:</strong> {order.shipping_email || 'N/A'}
                            </div>
                            <div>
                              <strong>Phone:</strong> {order.shipping_phone || 'N/A'}
                            </div>
                          </div>
                        </div>

                        {/* Shipping Address */}
                        <div style={{ marginBottom: '20px' }}>
                          <h4 style={{ margin: '0 0 12px 0', color: '#273c2e', fontSize: '1.1rem' }}>
                            📍 Shipping Address
                          </h4>
                          <div style={{ 
                            background: 'white', 
                            padding: '16px', 
                            borderRadius: '8px',
                            lineHeight: '1.8'
                          }}>
                            {order.shipping_full_name && <div>{order.shipping_full_name}</div>}
                            <div>{order.shipping_address || 'N/A'}</div>
                            <div>
                              {order.shipping_city || ''}{order.shipping_state ? `, ${order.shipping_state}` : ''} {order.shipping_zip_code || ''}
                            </div>
                            <div>{order.shipping_country || 'India'}</div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div style={{ marginBottom: '20px' }}>
                          <h4 style={{ margin: '0 0 12px 0', color: '#273c2e', fontSize: '1.1rem' }}>
                            🛍️ Products Ordered
                          </h4>
                          <div style={{ 
                            background: 'white', 
                            padding: '16px', 
                            borderRadius: '8px'
                          }}>
                            {Array.isArray(order.items) && order.items.length > 0 ? (
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ borderBottom: '2px solid #ede6d9' }}>
                                    <th style={{ padding: '10px', textAlign: 'left', color: '#273c2e' }}>Product Name</th>
                                    <th style={{ padding: '10px', textAlign: 'center', color: '#273c2e' }}>Quantity</th>
                                    <th style={{ padding: '10px', textAlign: 'right', color: '#273c2e' }}>Price</th>
                                    <th style={{ padding: '10px', textAlign: 'right', color: '#273c2e' }}>Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.items.map((item, idx) => (
                                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                      <td style={{ padding: '12px 10px' }}>{item.product_name || 'N/A'}</td>
                                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>{item.quantity || 0}</td>
                                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                                        ₹{Number(item.product_price || 0).toFixed(2)}
                                      </td>
                                      <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '600' }}>
                                        ₹{Number(item.item_total || 0).toFixed(2)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p style={{ color: '#666', margin: 0 }}>No items found in this order.</p>
                            )}
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div style={{ marginBottom: '20px' }}>
                          <h4 style={{ margin: '0 0 12px 0', color: '#273c2e', fontSize: '1.1rem' }}>
                            💰 Order Summary
                          </h4>
                          <div style={{ 
                            background: 'white', 
                            padding: '16px', 
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Subtotal:</span>
                              <span>₹{Number(order.subtotal || 0).toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>GST (18%):</span>
                              <span>₹{Number(order.gst_amount || 0).toFixed(2)}</span>
                            </div>
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              paddingTop: '8px',
                              borderTop: '2px solid #ede6d9',
                              fontWeight: '700',
                              fontSize: '1.1rem',
                              color: '#273c2e'
                            }}>
                              <span>Total Amount:</span>
                              <span>₹{Number(order.total_amount || 0).toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                              <span>Payment Method:</span>
                              <span style={{ 
                                textTransform: 'uppercase', 
                                fontWeight: '600',
                                color: order.payment_method === 'cod' ? '#f59e0b' : '#10b981'
                              }}>
                                {order.payment_method || 'N/A'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Payment Status:</span>
                              <span style={{ 
                                textTransform: 'uppercase', 
                                fontWeight: '600',
                                color: order.payment_status === 'completed' ? '#10b981' : '#f59e0b'
                              }}>
                                {order.payment_status || 'pending'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Accept Order Button */}
                        {order.order_status === 'pending' && (
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'flex-end',
                            paddingTop: '16px',
                            borderTop: '2px solid rgba(182, 158, 106, 0.3)'
                          }}>
                            <button
                              onClick={() => handleAcceptOrder(order.id)}
                              style={{
                                padding: '12px 24px',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseOver={(e) => {
                                e.target.style.background = '#059669';
                                e.target.style.transform = 'translateY(-2px)';
                              }}
                              onMouseOut={(e) => {
                                e.target.style.background = '#10b981';
                                e.target.style.transform = 'translateY(0)';
                              }}
                            >
                              ✅ Accept Order
                            </button>
                          </div>
                        )}

                        {order.order_status === 'accepted' && (
                          <div style={{ 
                            padding: '12px',
                            background: '#d1fae5',
                            borderRadius: '8px',
                            textAlign: 'center',
                            color: '#065f46',
                            fontWeight: '600',
                            marginTop: '16px'
                          }}>
                            ✓ Order Accepted
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Upload Images Tab */}
          {activeTab === 'upload' && (
            <div className="tab-content">
              <h2>Upload Product Images</h2>
              <form onSubmit={handleUpload} className="upload-form">
                <div className="form-group">
                  <label htmlFor="product-select">Select Product:</label>
                  <select
                    id="product-select"
                    value={selectedProductId}
                    onChange={handleProductSelect}
                    required
                    disabled={loadingProducts}
                  >
                    <option value="">
                      {loadingProducts ? 'Loading products...' : products.length === 0 ? 'No products found' : '-- Choose a Product --'}
                    </option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ₹{product.price} (Stock: {product.stock_quantity})
                      </option>
                    ))}
                  </select>
                </div>


            <div className="form-group">
              <label htmlFor="file-input" >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="upload-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                  <polyline points="7 9 12 4 17 9" />
                  <line x1="12" y1="4" x2="12" y2="16" />
                </svg>
                Upload Images
              </label>

              <input
                type="file"
                id="file-input"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                required
              
              />

              {selectedFiles.length > 0 && (
                    <div className="file-info">
                      <p>✓ Selected {selectedFiles.length} image{selectedFiles.length > 1 ? 's' : ''}:</p>
                      <ul>
                        {selectedFiles.map((file, index) => (
                          <li key={`${file.name}-${index}`}>
                            {file.name} ({(file.size / 1024).toFixed(0)} KB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
            </div>


                <button type="submit" className="upload-btn" disabled={loading}>
                  {loading ? '⏳ Uploading...' : '📸 Upload Image'}
                </button>
              </form>
            </div>
          )}

          {/* Manage Products Tab */}
          {activeTab === 'manage' && (
            <div className="tab-content">
              <h2>Manage Products ({products.length})</h2>
              <div className="products-grid">
                {products.map((product) => (
                  <div key={product.id} className="product-card-admin">
                    <div className="product-image-section">
                      {product.image ? (
                        <img src={product.image} alt={product.name} />
                      ) : (
                        <div className="no-image">📦 No Image</div>
                      )}
                    </div>
                    <div className="product-info-section">
                      <h3>{product.name}</h3>
                      {/* Quick Add to Bag (above description) */}
                      <div className="quick-add-row" style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '6px 0 10px' }}>
                        <input
                          type="number"
                          min="1"
                          value={quickAddQty[product.id] ?? 1}
                          onChange={(e) => setQuickAddQty(prev => ({ ...prev, [product.id]: parseInt(e.target.value || '1', 10) }))}
                          style={{ width: '72px', padding: '6px 8px', border: '1px solid #ede6d9', borderRadius: '6px' }}
                        />
                        <button
                          className="add-to-bag-btn"
                          onClick={() => handleQuickAddToBill(product.id)}
                          style={{ padding: '8px 12px', background: '#b69e6a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Add to Bag
                        </button>
                      </div>
                      <p className="product-desc">{product.description}</p>
                      <div className="product-meta">
                        <span className="meta-item">💰 ₹{product.price}</span>
                        <span className="meta-item">🎯 {product.age_range}</span>
                      </div>
                      
                      {/* Stock Edit Section */}
                      {editingProductId === product.id ? (
                        <div className="stock-edit-section">
                          <label>Update Stock:</label>
                          <div className="stock-edit-controls">
                            <input
                              type="number"
                              min="0"
                              value={editStockValue}
                              onChange={(e) => setEditStockValue(e.target.value)}
                              className="stock-input"
                              placeholder="Enter new stock"
                            />
                            <button 
                              className="save-stock-btn"
                              onClick={() => handleUpdateStock(product.id)}
                            >
                              ✓ Save
                            </button>
                            <button 
                              className="cancel-stock-btn"
                              onClick={cancelEditingStock}
                            >
                              ✗ Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="stock-display">
                          <span className="meta-item stock-info">
                            📦 Stock: <strong>{product.stock_quantity}</strong> units
                          </span>
                        </div>
                      )}
                      
                      <div className="product-actions">
                        {editingProductId !== product.id && (
                          <button 
                            className="edit-stock-btn"
                            onClick={() => startEditingStock(product.id, product.stock_quantity)}
                          >
                            ✏️ Edit Stock
                          </button>
                        )}
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="tab-content">
              <h2>💳 Offline Billing (POS)</h2>
              
              <div className="billing-container">
                {/* Left Section - Add Items */}
                <div className="billing-left">
                  <div className="customer-info-section">
                    <h3>Customer Information (Optional)</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="customer-name">Customer Name</label>
                        <input
                          type="text"
                          id="customer-name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Enter customer name"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="customer-phone">Phone Number</label>
                        <input
                          type="tel"
                          id="customer-phone"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="add-item-section">
                    <h3>Add Items to Bill</h3>
                    <div className="form-row">
                      <div className="form-group" style={{ flex: 2 }}>
                        <label htmlFor="billing-product-select">Select Product</label>
                        <select
                          id="billing-product-select"
                          value={selectedBillingProduct}
                          onChange={(e) => setSelectedBillingProduct(e.target.value)}
                        >
                          <option value="">-- Choose a Product --</option>
                          {products.filter(p => p.stock_quantity > 0).map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} - ₹{product.price} (Stock: {product.stock_quantity})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="billing-quantity">Quantity</label>
                        <input
                          type="number"
                          id="billing-quantity"
                          value={billingQuantity}
                          onChange={(e) => setBillingQuantity(parseInt(e.target.value) || 1)}
                          min="1"
                        />
                      </div>
                      <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                        <button 
                          type="button" 
                          className="add-item-btn"
                          onClick={handleAddToBill}
                        >
                          ➕ Add to Bill
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section - Bill Display */}
                <div className="billing-right">
                  <div className="bill-display">
                    <h3>Current Bill</h3>
                    
                    {billItems.length === 0 ? (
                      <div className="empty-bill">
                        <p>No items added yet</p>
                      </div>
                    ) : (
                      <>
                        <div className="bill-items">
                          <table className="bill-table">
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th>Price</th>
                                <th>Qty</th>
                                <th>Total</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {billItems.map((item) => (
                                <tr key={item.id}>
                                  <td>{item.name}</td>
                                  <td>₹{item.price.toFixed(2)}</td>
                                  <td>
                                    <div className="quantity-controls">
                                      <button 
                                        onClick={() => handleUpdateBillQuantity(item.id, item.quantity - 1)}
                                        className="qty-btn"
                                      >
                                        −
                                      </button>
                                      <span>{item.quantity}</span>
                                      <button 
                                        onClick={() => handleUpdateBillQuantity(item.id, item.quantity + 1)}
                                        className="qty-btn"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </td>
                                  <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                                  <td>
                                    <button 
                                      onClick={() => handleRemoveFromBill(item.id)}
                                      className="remove-item-btn"
                                    >
                                      🗑️
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="bill-summary">
                          <div className="summary-row">
                            <span>Subtotal:</span>
                            <span>₹{calculateBillTotal().subtotal.toFixed(2)}</span>
                          </div>
                          {/* <div className="summary-row">
                            <span>GST (18%):</span>
                            <span>₹{calculateBillTotal().gst.toFixed(2)}</span>
                          </div> */}
                          <div className="summary-row total">
                            <span>Total Amount:</span>
                            <span>₹{calculateBillTotal().total.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="bill-actions">
                          <button 
                            onClick={handlePrintBill}
                            className="print-btn"
                          >
                            🖨️ Print Bill
                          </button>
                          <button 
                            onClick={handleClearBill}
                            className="clear-btn"
                          >
                            🗑️ Clear Bill
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {activeTab === 'giftcard' && (
  <div className="tab-content">
    <h2>🎁 Add Gift Card</h2>
    <form
      onSubmit={handleAddGiftCard}
      className="product-form"
      encType="multipart/form-data"
    >
      <div className="form-group">
        <label>Gift Card Title *</label>
        <input
          type="text"
          name="title"
          value={newGiftCard.title}
          onChange={handleGiftCardChange}
          placeholder="e.g., The Toycra Gift Card"
          required
        />
      </div>

      <div className="form-group">
        <label>Brand *</label>
        <input
          type="text"
          name="brand"
          value={newGiftCard.brand}
          onChange={handleGiftCardChange}
          placeholder="e.g., Toycra"
          required
        />
      </div>

      <div className="form-group">
        <label>SKU *</label>
        <input
          type="text"
          name="sku"
          value={newGiftCard.sku}
          onChange={handleGiftCardChange}
          placeholder="e.g., TG500"
          required
        />
      </div>

      <div className="form-group">
        <label>Base Price *</label>
        <input
          type="number"
          name="base_price"
          value={newGiftCard.base_price}
          onChange={handleGiftCardChange}
          placeholder="500"
          required
        />
      </div>

      <div className="form-group">
        <label>Available Values (comma separated)</label>
        <input
          type="text"
          name="price_options"
          value={newGiftCard.price_options}
          onChange={handleGiftCardChange}
          placeholder="500,1000,2000,5000"
        />
      </div>

      <div className="form-group">
        <label>Description *</label>
        <textarea
          name="description"
          value={newGiftCard.description}
          onChange={handleGiftCardChange}
          placeholder="Write a short description..."
          rows="3"
          required
        />
      </div>

      <div className="form-group">
        <label>Upload Images *</label>
        <input type="file" accept="image/*" onChange={handleGiftCardImageChange} multiple required />
        {giftCardImages && giftCardImages.length > 0 && (
          <p className="file-info">{giftCardImages.length} file(s) selected</p>
        )}
      </div>

      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? 'Uploading...' : '🎁 Add Gift Card'}
      </button>
    </form>

    {/* Available gift cards list */}
    <div style={{ marginTop: '24px' }}>
      <h3>Available Gift Cards</h3>
      {loadingGiftCards ? (
        <p>Loading gift cards...</p>
      ) : (
        <div className="products-grid">
          {giftCards.length === 0 ? (
            <p>No gift cards available.</p>
          ) : (
            giftCards.map((gc) => (
              <div key={gc.id} className="product-card-admin">
                <div className="product-image-section">
                  {gc.image_url ? (
                    <img src={`http://localhost:5000${gc.image_url}`} alt={gc.title} />
                  ) : (
                    <div className="no-image">📦 No Image</div>
                  )}
                </div>
                <div className="product-info-section">
                  <h3>{gc.title}</h3>
                  <div className="product-meta">
                    <span className="meta-item">Brand: {gc.brand}</span>
                    <span className="meta-item">SKU: {gc.sku}</span>
                  </div>
                  <div className="product-meta">
                    <span className="meta-item">
                      Price: ₹{(() => {
                        try {
                          const opts = gc.price_options ? JSON.parse(gc.price_options) : [];
                          if (Array.isArray(opts) && opts.length > 0) return Number(opts[0]);
                        } catch (_) {}
                        return Number(gc.base_price || 0);
                      })()}
                    </span>
                  </div>
                  <div className="product-actions">
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteGiftCard(gc.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  </div>
)}


        
        {/* Legacy small popup */}
        {showPopup && (
          <div className="popup-overlay">
            <div className="popup-box">
              <p>{popupMessage}</p>
            </div>
          </div>
        )}

        {/* Centered polished toast (unified across admin actions) */}
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
                  background:
                    toast.kind === 'error'
                      ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                      : toast.kind === 'warn'
                      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                      : 'linear-gradient(135deg, #6fbf8c, #4f8f70)',
                  color: '#fff7eb',
                  boxShadow:
                    toast.kind === 'error'
                      ? '0 8px 20px rgba(239,68,68,0.35)'
                      : toast.kind === 'warn'
                      ? '0 8px 20px rgba(245,158,11,0.35)'
                      : '0 8px 20px rgba(111,191,140,0.35)',
                  border: '2px solid rgba(255,255,255,0.55)'
                }}
              >
                {toast.kind === 'error' ? '!' : '✓'}
              </div>
              <div style={{ fontSize: 18, letterSpacing: 0.2, marginBottom: 4 }}>
                {toast.message}
              </div>
            </div>
          </div>
        )}

        {/* Centered confirm modal for destructive actions */}
        {confirmState.open && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.25)',
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
                width: 'min(92vw, 480px)',
                textAlign: 'center',
                animation: 'kpScaleIn 240ms ease-out',
                fontWeight: 700
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
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff7eb',
                  boxShadow: '0 8px 20px rgba(245,158,11,0.35)',
                  border: '2px solid rgba(255,255,255,0.55)'
                }}
              >
                !
              </div>
              <div style={{ fontSize: 18, letterSpacing: 0.2, marginBottom: 12 }}>
                {confirmState.message}
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="save-stock-btn" onClick={handleConfirmYes} style={{ minWidth: 100 }}>
                  Yes
                </button>
                <button className="cancel-stock-btn" onClick={handleConfirmNo} style={{ minWidth: 100 }}>
                  No
                </button>
              </div>
            </div>
          </div>
        )}


      </main>
      <Footer />
    </div>
  );
};
}
export default AdminPage;