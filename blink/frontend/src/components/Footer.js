import React from 'react';
import '../styles/Footer.css'; // CSS code provided below

function Footer() {
  const usefulLinks = [
    "Blog", "Privacy", "Terms", "FAQs", "Security", "Contact", "Partner", "Franchise", 
    "Seller", "Warehouse", "Deliver", "Resources", "Recipes", "Bistro"
  ];

  const categories = [
    "Dairy & Breakfast", "Vegetables & Fruits", "Cold Drinks & Juices", "Bakery & Biscuits", 
    "Dry Fruits, Masala & Oil", "Ice Creams & Desserts", "Beauty & Cosmetics", "Stationery Needs",
    "Instant & Frozen Food", "Sweet Tooth", "Sauces & Spreads", "Organic & Premium", 
    "Cleaning Essentials", "Personal Care", "Fashion & Accessories", "Tea, Coffee & Health Drinks",
    "Atta, Rice & Dal", "Baby Care", "Pet Care"
  ];

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-section">
          <h4>Useful Links</h4>
          <ul>
            {usefulLinks.map((link, index) => (
              <li key={index}>{link}</li>
            ))}
          </ul>
        </div>

        <div className="footer-section">
          <h4>Categories</h4>
          <ul className="categories">
            {categories.map((category, index) => (
              <li key={index}>{category}</li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default Footer;