// src/components/ModernNavbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import logo from '../assets/logos.png';

const ModernNavbar = ({ showSearch = true }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, itemCount } = useCart();

  // Use the itemCount from context (already calculates total quantity)
  const cartItemsCount = itemCount || 0;

  return (
    <nav className="bg-emerald-600 text-white shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo and Nav Links */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <img className="h-10 w-auto" src={logo} alt="Logo"/>
            </div>
            <div className="hidden lg:ml-10 lg:flex lg:space-x-8">
              <Link to="/" className="text-white/90 hover:text-white h-full flex items-center px-2 text-sm font-medium transition-colors hover:bg-emerald-500/30 rounded-md">
                Home
              </Link>
              <Link to="/products" className="text-white/90 hover:text-white h-full flex items-center px-2 text-sm font-medium transition-colors hover:bg-emerald-500/30 rounded-md">
                Shop
              </Link>
              <Link to="/deals" className="text-white/90 hover:text-white h-full flex items-center px-2 text-sm font-medium transition-colors hover:bg-emerald-500/30 rounded-md">
                Deals
              </Link>
              {user && (
                <Link to="/orders" className="text-white/90 hover:text-white h-full flex items-center px-2 text-sm font-medium transition-colors hover:bg-emerald-500/30 rounded-md">
                  Orders
                </Link>
              )}
            </div>
          </div>

          {/* Search Bar (Desktop) */}
          {showSearch && (
            <div className="hidden lg:flex flex-1 items-center justify-center px-2 lg:ml-6 lg:justify-end">
              <div className="max-w-lg w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="block w-full bg-white/95 text-gray-900 border border-transparent rounded-full py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:bg-white focus:border-white focus:ring-2 focus:ring-white/60 transition-colors"
                    placeholder="Search products..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.target.value.trim()) {
                        navigate(
                          `/products?search=${encodeURIComponent(e.target.value.trim())}`,
                        );
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

                      {/* Cart */}
            <button
              onClick={() => navigate("/cart")}
              className="relative p-2 rounded-full text-white/90 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-600 transition-colors cursor-pointer"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartItemsCount > 0 && (
                <span className="absolute top-2 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[20px] h-[20px] shadow-lg border-2 border-emerald-600">
                  {cartItemsCount > 99 ? "99+" : cartItemsCount}
                </span>
              )}
            </button>

          {/* Action Icons - Hidden on Mobile */}
          <div className="hidden lg:flex items-center ml-6 space-x-2">
            {/* Wishlist */}
            <button
              onClick={() => navigate("/dashboard?tab=wishlist")}
              className="p-2 rounded-full text-white/90 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-600 transition-colors cursor-pointer"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>

            {/* User Menu */}
            <div className="ml-2 relative">
              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-600"
                >
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-emerald-600 font-semibold text-sm">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="bg-white text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-full text-sm font-medium transition-all shadow-md"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default ModernNavbar;
