import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css'; // CSS code provided below

function Footer() {
  const usefulLinks = [
    { name: "Blog", path: "/blog" },
    { name: "Privacy", path: "/privacy" },
    { name: "Cookie Policy", path: "/cookie-policy" },
    { name: "Terms", path: "/terms" },
    { name: "FAQs", path: "/faqs" },
    { name: "Security", path: "/security" },
    { name: "Contact", path: "/contact" },
    { name: "Partner", path: "/partner" },
    { name: "Franchise", path: "/franchise" },
    { name: "Seller", path: "/seller" },
    { name: "Warehouse", path: "/warehouse" },
    { name: "Deliver", path: "/deliver" },
    { name: "Resources", path: "/resources" },
    { name: "Recipes", path: "/recipes" },
    { name: "Bistro", path: "/bistro" }
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
              <li key={index}>
                <Link to={link.path} className="footer-link">
                  {link.name}
                </Link>
              </li>
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