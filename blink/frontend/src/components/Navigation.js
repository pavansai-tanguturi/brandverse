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
    <header className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-2xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer flex-shrink-0" onClick={() => navigate('/')}>
            <img
              src={logo}
              className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg"
              alt="Brandverse"
            />
            <span className="font-bold text-sm sm:text-lg md:text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Brandverse
            </span>
          </div>

          {/* Search Icon - Navigate to Search Page */}
          {showSearch && (
            <div className="hidden md:flex flex-1 justify-center max-w-xs">
              <button 
                onClick={() => navigate('/search')}
                className="flex items-center space-x-2 bg-white/10 backdrop-blur-lg rounded-xl px-4 py-2 cursor-pointer hover:bg-white/20 transition-all"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-white text-sm font-medium">Search</span>
              </button>
            </div>
          )}

          {/* Location Display - Hidden on small screens */}
          <div className="hidden lg:flex items-center space-x-2 bg-white/10 backdrop-blur-lg rounded-xl px-3 py-2 cursor-pointer hover:bg-white/20 transition-all">
            <img src={locationIcon} className="h-4 w-4" alt="location" />
            <div className="flex flex-col">
              <span className="text-gray-300 text-xs uppercase tracking-wide">Deliver to</span>
              <span className="text-white text-xs font-medium">{locationName}</span>
            </div>
          </div>

          {/* User Actions - Mobile Optimized */}
          <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
            {/* Mobile Search Icon */}
            {showSearch && (
              <button 
                onClick={() => navigate('/search')}
                className="md:hidden flex items-center bg-white/10 backdrop-blur-lg rounded-lg px-2 py-1.5 cursor-pointer hover:bg-white/20 transition-all"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}

            {user ? (
              <Link to="/dashboard" className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 rounded-lg sm:rounded-xl px-2 sm:px-4 py-1.5 sm:py-2 text-white transition-all shadow-lg">
                <div className="bg-white/20 rounded-full p-0.5 sm:p-1">
                  <CustomerIcon width={14} height={14} color="white" />
                </div>
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                  {user.name || user.email?.split('@')[0] || 'User'}
                </span>
              </Link>
            ) : (
              <Link to="/login" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all shadow-lg text-xs sm:text-sm">
                Login
              </Link>
            )}

            {/* Orders - Only for logged in users */}
            {user && (
              <div className="flex items-center space-x-1 sm:space-x-2 bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 cursor-pointer hover:bg-white/20 transition-all" onClick={() => navigate('/orders')}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="hidden md:inline text-white text-xs sm:text-sm">Orders</span>
              </div>
            )}

            {/* Cart - Always Visible */}
            <div className="flex items-center space-x-1 sm:space-x-2 bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 cursor-pointer hover:bg-white/20 transition-all" onClick={() => navigate('/cart')}>
              <CartIcon className="w-5 h-5 sm:w-5 sm:h-5" strokeColor="white" />
              <span className="hidden md:inline text-white text-xs sm:text-sm">Cart</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
