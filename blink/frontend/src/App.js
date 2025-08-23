// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import HealthCheck from './pages/HealthCheck';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import Logout from './pages/Logout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/health" element={<HealthCheck />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
  <Route path="/admin/products" element={<AdminProducts />} />
  <Route path="/admin/logout" element={<Logout />} />
      </Routes>
    </Router>
  );
}

export default App;
