import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CustomerIcon } from './icons';
import CartIcon from './CartIcon';
import logo from '../assets/logos.png';
import locationIcon from '../assets/location.png';

const Navigation = ({ showSearch = true }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [locationName, setLocationName] = useState('Fetching location...');

  // Get location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const city = data.address.city || data.address.town || data.address.village || 'Unknown location';
          setLocationName(city);
        } catch (error) {
          console.error('Error fetching location:', error);
          setLocationName('Location unavailable');
        }
      }, () => {
        setLocationName('Location permission denied');
      });
    } else {
      setLocationName('Geolocation not supported');
    }
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer flex-shrink-0"
          >
            <img src={logo} className="h-10 sm:h-12 w-auto object-contain rounded-lg" alt="Logo" />
          </button>

          {/* Search Bar - Desktop */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-2xl mx-4 lg:mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search for products, brands and more..."
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 pl-12 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  onClick={() => navigate('/search')}
                  readOnly
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
            {/* Account */}
            {user ? (
              <Link
                to="/dashboard"
                className="hidden md:flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3 sm:px-4 py-2 transition-colors shadow"
              >
                <div className="bg-white/20 rounded-full p-1">
                  <CustomerIcon width={16} height={16} color="white" />
                </div>
                <span className="hidden lg:inline text-sm font-medium truncate max-w-[100px]">
                  {user.name || user.email?.split('@')[0] || 'Account'}
                </span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-6 py-2 rounded-xl transition-colors shadow text-sm font-medium"
              >
                Login
              </Link>
            )}

            {/* Orders */}
            {user && (
              <button
                type="button"
                onClick={() => navigate('/orders')}
                className="hidden lg:flex items-center space-x-2 border border-gray-200 bg-white rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-gray-800 text-sm font-medium">Orders</span>
              </button>
            )}

            {/* Mobile Search */}
            {showSearch && (
              <button
                type="button"
                onClick={() => navigate('/search')}
                className="md:hidden flex items-center justify-center bg-gray-100 rounded-xl p-2 hover:bg-gray-200 transition-colors"
                aria-label="Search"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}

            {/* Cart */}
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="flex items-center space-x-2 border border-gray-200 bg-white rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors relative"
            >
              <CartIcon className="w-5 h-5" strokeColor="#059669" />
              <span className="hidden sm:inline text-gray-800 text-sm font-medium">Cart</span>
              {user?.cartItems?.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {user.cartItems.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile location strip */}
        <div className="md:hidden flex items-center justify-between bg-emerald-50 rounded-lg px-3 py-2 mt-2">
          <div className="flex items-center space-x-2">
            <img src={locationIcon} className="h-4 w-4" alt="location" />
            <span className="text-emerald-700 text-xs font-medium">Delivering to</span>
          </div>
          <span className="text-gray-900 text-sm font-medium truncate flex-1 text-right ml-2">{locationName}</span>
        </div>
      </div>
    </header>
  );
};

export default Navigation;