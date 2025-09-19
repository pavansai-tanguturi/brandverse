import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AddressProvider } from './context/AddressContext';
import CookieConsent from './components/CookieConsent';
import CookiePolicy from './components/CookiePolicy';
import Auth from './pages/Auth';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import Products from './pages/Products';
import Search from './pages/Search';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/checkout/CheckoutPage';
import OrderSuccessPage from './pages/checkout/OrderSuccessPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import HealthCheck from './pages/HealthCheck';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import AdminLogin from './pages/admin/AdminLogin';
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
      <CartProvider>
        <WishlistProvider>
          <AddressProvider>
            <Router>
          <Routes>
            {/* Regular User Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/search" element={<Search />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route path="/orders" element={<OrderHistoryPage />} />
            <Route path="/dashboard" element={<CustomerDashboard />} />
            
            {/* Cookie Policy */}
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            
            {/* Authentication Routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/401" element={<UnauthorizedPage />} />
            <Route path="/health" element={<HealthCheck />} />
            <Route path="/401" element={<UnauthorizedPage />} />
            <Route path="/logout" element={<Logout />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/delivery-locations" element={<AdminDeliveryLocations />} />
            <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
            <Route path="/admin/logout" element={<Logout />} />
          </Routes>
              
              {/* Cookie Consent Banner - appears on all pages */}
              <CookieConsent />
            </Router>
          </AddressProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
