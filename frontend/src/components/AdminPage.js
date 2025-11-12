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


  // Popup
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  
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
      setMessage('');
      return;
    }

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
      setMessage('Error uploading image');
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

    alert('✅ Product added successfully!');
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
    alert('❌ Error adding product: ' + error.message);
  } finally {
    setLoading(false);
  }
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
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setPopupMessage('Product deleted successfully!');
        setShowPopup(true);
        // Hide popup after 1 seconds
        setTimeout(() => setShowPopup(false), 1000);
        fetchProducts();
      } else {
        setMessage(data.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMessage('Error deleting product');
    }
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
        <title>Bill - KiddyPalace</title>
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
          <h1>KiddyPalace STORE</h1>
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
            <button className="logout-btn" onClick={handleLogout}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Logout
            </button>
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
        
        {/* Popup for stock update success */}
        {showPopup && ( 
          <div className="popup-overlay">
            <div className="popup-box">
              <p>{popupMessage}</p>
              </div>
              </div>
            )}

      </main>
      <Footer />
    </div>
  );
};

export default AdminPage;