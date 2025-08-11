// src/pages/CategoryPage.js
import React from 'react';
import './CategoryPage.css';

function CategoryPage({ category }) {
  return (
    <div className="category-page">
      <h2>{category} Products</h2>
      <div className="product-grid">
        {/* Example product card */}
        <div className="product-card">
          <img src="https://via.placeholder.com/150" alt="Product" />
          <h3>Product Name</h3>
          <p>Price: ₹99</p>
          <p>Weight: 1kg</p>
          <button>Add to Cart</button>
        </div>
        {/* Add more product cards here or map through data */}
      </div>
    </div>
  );
}

export default CategoryPage;
