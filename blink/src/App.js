// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Login from './Login';
import Cart from './Cart';
import SignUp from './SignUp';
import CategoryPage from './pages/CategoryPage';
import Home from './pages/Home';
import Footer from './components/Footer'; // ✅ Make sure Footer is in components folder

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* All routes/pages */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
        </Routes>

        {/* Global Footer shown on all pages */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;
