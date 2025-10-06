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
    <header className="bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-800 shadow-2xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer flex-shrink-0" onClick={() => navigate('/')}> 
            <img
              src={logo}
              className="h-10 sm:h-12 w-auto object-contain rounded-lg"
              alt="Akepatimart"
            />
            
          </div>

          {/* Search Bar - Desktop */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-2xl mx-4 lg:mx-8">
              <div className="relative w-full">
                <input 
                  type="text" 
                  placeholder="Search for products, brands and more..." 
                  className="w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl px-4 py-3 pl-12 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  onClick={() => navigate('/search')}
                  readOnly
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Location Display - Desktop */}
          <div className="hidden xl:flex items-center space-x-2 bg-white/10 backdrop-blur-lg rounded-xl px-4 py-2 cursor-pointer hover:bg-white/20 transition-all flex-shrink-0">
            <img src={locationIcon} className="h-4 w-4" alt="location" />
            <div className="flex flex-col">
              <span className="text-gray-300 text-xs uppercase tracking-wide">Deliver to</span>
              <span className="text-white text-sm font-medium truncate max-w-[120px]">{locationName}</span>
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
            {/* Note: Mobile search icon is placed next to Cart below to keep layout compact */}

            {/* User Account */}
            {user ? (
              <div className="hidden md:flex items-center space-x-1 sm:space-x-2">
                <Link 
                  to="/dashboard" 
                  className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl px-3 sm:px-4 py-2 text-white transition-all shadow-lg"
                >
                  <div className="bg-white/20 rounded-full p-1">
                    <CustomerIcon width={16} height={16} color="white" />
                  </div>
                  <span className="hidden lg:inline text-sm font-medium truncate max-w-[100px]">
                    {user.name || user.email?.split('@')[0] || 'User'}
                  </span>
                </Link>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="hidden md:flex bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 sm:px-6 py-2 rounded-xl transition-all shadow-lg text-sm font-medium"
              >
                Login
              </Link>
            )}

            {/* Orders - Only for logged in users */}
            {user && (
              <button 
                onClick={() => navigate('/orders')}
                className="hidden lg:flex items-center space-x-2 bg-white/10 backdrop-blur-lg rounded-xl px-3 py-2 cursor-pointer hover:bg-white/20 transition-all"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-white text-sm font-medium">Orders</span>
              </button>
            )}

            {/* Mobile Search Icon (small screens, next to cart) */}
            {showSearch && (
              <button 
                onClick={() => navigate('/search')}
                className="md:hidden flex items-center justify-center bg-white/10 backdrop-blur-lg rounded-xl p-2 cursor-pointer hover:bg-white/20 transition-all"
                aria-label="Search"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}

            {/* Cart - Always Visible */}
            <button 
              onClick={() => navigate('/cart')}
              className="flex items-center space-x-2 bg-white/10 backdrop-blur-lg rounded-xl px-3 py-2 cursor-pointer hover:bg-white/20 transition-all relative"
            >
              <CartIcon className="w-5 h-5" strokeColor="white" />
              <span className="hidden sm:inline text-white text-sm font-medium">Cart</span>
              
              {/* Cart Badge */}
              {user?.cartItems?.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {user.cartItems.length}
                </span>
              )}
            </button>

           
          </div>
        </div>

        {/* Mobile Search Bar - Shows below main nav */}
        {/* {showSearch && (
          <div className="md:hidden pb-3">
            <div 
              className="relative w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl px-4 py-3 pl-12 text-white placeholder-gray-300 cursor-pointer"
              onClick={() => navigate('/search')}
            >
              <span className="text-sm">Search for products, brands and more...</span>
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        )} */}

        {/* Mobile Location - Shows below search */}
        <div className="md:hidden flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 mt-2">
          <div className="flex items-center space-x-2">
            <img src={locationIcon} className="h-4 w-4" alt="location" />
            <span className="text-white text-xs font-medium">Delivering to</span>
          </div>
          <span className="text-white text-sm font-medium truncate flex-1 text-right ml-2">
            {locationName}
          </span>
        </div>
      </div>

      {/* Secondary Navigation Bar */}
      <div className="bg-emerald-900/80 backdrop-blur-sm border-b border-emerald-700/50">
        
      </div>
    </header>
  );
};

export default Navigation;