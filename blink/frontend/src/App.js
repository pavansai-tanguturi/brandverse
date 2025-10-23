import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { AddressProvider } from "./context/AddressContext";
import { ProductProvider } from "./context/ProductContext";
import CookieConsent from "./components/CookieConsent";
import CookiePolicy from "./components/CookiePolicy";
import Footer from "./components/Footer";
import Auth from "./pages/Auth";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Products from "./pages/Products";
import Deals from "./pages/Deals";
import Search from "./pages/Search";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import Wishlist from "./pages/Wishlist";
import CheckoutPage from "./pages/checkout/CheckoutPage";
import OrderSuccessPage from "./pages/checkout/OrderSuccessPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import HealthCheck from "./pages/HealthCheck";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminDeliveryLocations from "./pages/admin/AdminDeliveryLocations";
import AnalyticsDashboard from "./pages/admin/AnalyticsDashboard";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import Logout from "./pages/Logout";
import ProtectedRoute from "./components/ProtectedRoute";

// Component to conditionally render Footer
const ConditionalFooter = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isCheckoutRoute =
    location.pathname === "/checkout" || location.pathname === "/order-success";
  const isUnauthorizedPage = location.pathname === "/401";

  // Don't show footer on admin pages, checkout/order success pages, and 401 page
  if (isAdminRoute || isCheckoutRoute || isUnauthorizedPage) {
    return null;
  }

  return <Footer />;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <AddressProvider>
            <ProductProvider>
              <Router>
                <Routes>
                  {/* Regular User Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/home" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/deals" element={<Deals />} />
                <Route path="/search" element={<Search />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/wishlist" element={<Wishlist />} />
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
                <Route path="/logout" element={<Logout />} />

                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/products"
                  element={
                    <ProtectedRoute>
                      <AdminProducts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <ProtectedRoute>
                      <AdminOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute>
                      <AdminUsers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/delivery-locations"
                  element={
                    <ProtectedRoute>
                      <AdminDeliveryLocations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <ProtectedRoute>
                      <AnalyticsDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/categories"
                  element={
                    <ProtectedRoute>
                      <AdminCategories />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/banners"
                  element={
                    <ProtectedRoute>
                      <AdminBanners />
                    </ProtectedRoute>
                  }
                />
                <Route path="/admin/logout" element={<Logout />} />

                {/* Catch any other /admin/* routes that aren't defined */}
                <Route
                  path="/admin/*"
                  element={<Navigate to="/401" replace />}
                />

                {/* 404 - Catch all undefined routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              {/* Conditional Footer - appears on all pages except admin and checkout */}
              <ConditionalFooter />

              {/* Cookie Consent Banner - appears on all pages */}
              <CookieConsent />
            </Router>
          </ProductProvider>
        </AddressProvider>
      </WishlistProvider>
    </CartProvider>
  </AuthProvider>
  );
}

export default App;
