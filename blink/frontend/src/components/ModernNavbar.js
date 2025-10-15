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

  console.log('Desktop Nav - Cart Items:', items);
  console.log('Desktop Nav - Cart Items Count:', cartItemsCount);

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
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        navigate(`/products?q=${encodeURIComponent(e.target.value.trim())}`);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Icons */}
          <div className="flex items-center lg:ml-6 space-x-2">
            {/* Wishlist */}
            <button 
              onClick={() => navigate('/dashboard?tab=wishlist')}
              className="p-2 rounded-full text-white/90 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-600 transition-colors cursor-pointer"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>

            {/* Cart */}
            <button 
              onClick={() => navigate('/cart')}
              className="relative p-2 rounded-full text-white/90 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-600 transition-colors cursor-pointer hidden lg:flex"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  <path d="M2 3L2.26491 3.0883C3.58495 3.52832 4.24497 3.74832 4.62248 4.2721C5 4.79587 5 5.49159 5 6.88304V9.5C5 12.3284 5 13.7426 5.87868 14.6213C6.75736 15.5 8.17157 15.5 11 15.5H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                  <path d="M7.5 18C8.32843 18 9 18.6716 9 19.5C9 20.3284 8.32843 21 7.5 21C6.67157 21 6 20.3284 6 19.5C6 18.6716 6.67157 18 7.5 18Z" stroke="currentColor" strokeWidth="1.5"></path>
                  <path d="M16.5 18.0001C17.3284 18.0001 18 18.6716 18 19.5001C18 20.3285 17.3284 21.0001 16.5 21.0001C15.6716 21.0001 15 20.3285 15 19.5001C15 18.6716 15.6716 18.0001 16.5 18.0001Z" stroke="currentColor" strokeWidth="1.5"></path>
                  <path d="M5 6H16.4504C18.5054 6 19.5328 6 19.9775 6.67426C20.4221 7.34853 20.0173 8.29294 19.2078 10.1818L18.7792 11.1818C18.4013 12.0636 18.2123 12.5045 17.8366 12.7523C17.4609 13 16.9812 13 16.0218 13H5" stroke="currentColor" strokeWidth="1.5"></path>
                </g>
              </svg>
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[20px] h-[20px] shadow-lg border-2 border-emerald-600">
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div className="ml-2 relative hidden lg:flex">
              <button
                onClick={() => navigate(user ? '/dashboard' : '/login')}
                className="p-2 rounded-full text-white/90 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-600 transition-colors cursor-pointer"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                  <g id="SVGRepo_iconCarrier">
                    <path d="M12.12 12.78C12.05 12.77 11.96 12.77 11.88 12.78C10.12 12.72 8.71997 11.28 8.71997 9.50998C8.71997 7.69998 10.18 6.22998 12 6.22998C13.81 6.22998 15.28 7.69998 15.28 9.50998C15.27 11.28 13.88 12.72 12.12 12.78Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M18.74 19.3801C16.96 21.0101 14.6 22.0001 12 22.0001C9.40001 22.0001 7.04001 21.0101 5.26001 19.3801C5.36001 18.4401 5.96001 17.5201 7.03001 16.8001C9.77001 14.9801 14.25 14.9801 16.97 16.8001C18.04 17.5201 18.64 18.4401 18.74 19.3801Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  </g>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default ModernNavbar;
