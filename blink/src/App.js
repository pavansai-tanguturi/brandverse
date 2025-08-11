// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
// import Navigation from './components/Navigation';
import './styles/App.css';

import Auth from './pages/Auth'; // New unified auth component
import Logout from './pages/Logout'; // New logout page
import Cart from './components/Cart';
import CategoryPage from './pages/CategoryPage';
import Home from './pages/Home';
import Footer from './components/Footer'; // ✅ Make sure Footer is in components folder

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          {/* Navigation bar with Login/Logout */}
          {/* <Navigation /> */}
          
          {/* All routes/pages */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Auth />} /> {/* Redirect old login to auth */}
            <Route path="/signup" element={<Auth />} /> {/* Redirect old signup to auth */}
            <Route path="/logout" element={<Logout />} /> {/* New logout page */}
            <Route path="/cart" element={<Cart />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
          </Routes>

          {/* Global Footer shown on all pages */}
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
