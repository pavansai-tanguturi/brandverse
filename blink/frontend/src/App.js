import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Auth from './pages/Auth';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import ProductPage from './pages/ProductPage';
import Cart from './components/Cart';
import HealthCheck from './pages/HealthCheck';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDeliveryLocations from './pages/admin/AdminDeliveryLocations';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import UnauthorizedPage from './pages/UnauthorizedPage';
import Logout from './pages/Logout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Regular User Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/dashboard" element={<CustomerDashboard />} />
          
          {/* Authentication Routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/401" element={<UnauthorizedPage />} />
          <Route path="/health" element={<HealthCheck />} />
          <Route path="/401" element={<UnauthorizedPage />} />
          <Route path="/logout" element={<Logout />} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/delivery-locations" element={<AdminDeliveryLocations />} />
          <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
          <Route path="/admin/logout" element={<Logout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
