// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDeliveryInfo, deliveryLocations } from '../data/mockDeliveryData';
import logo from '../assets/logos.png';
import cart from '../assets/cart.png';
import locationIcon from '../assets/location.png';
import '../styles/App.css';
import '../styles/tailwind-utilities.css';

function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [locationName, setLocationName] = useState('Fetching location...');
  const [deliveryTime, setDeliveryTime] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchLocation = async () => {
    if (!navigator.geolocation) {
      setLocationName('Geolocation not supported');
      return;
    }

    setIsLocationLoading(true);
    setLocationName('Updating location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const newLocation = data.address.city || data.address.town || data.address.village || 'Unknown location';
          const deliveryInfo = getDeliveryInfo(newLocation);
          setLocationName(deliveryInfo.shortName);
          setDeliveryTime(deliveryInfo.deliveryTime);
          setShowLocationModal(false); // Close modal after detecting location
        } catch (error) {
          console.error('Error fetching location name:', error);
          setLocationName('Location unavailable');
          setDeliveryTime(null);
        } finally {
          setIsLocationLoading(false);
        }
      }, 
      () => {
        setLocationName('Location permission denied');
        setDeliveryTime(null);
        setIsLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // Always get fresh location
      }
    );
  };

  const handleManualLocation = () => {
    if (manualLocation.trim()) {
      const deliveryInfo = getDeliveryInfo(manualLocation.trim());
      setLocationName(deliveryInfo.shortName);
      setDeliveryTime(deliveryInfo.deliveryTime);
      setShowLocationModal(false);
      setManualLocation('');
    }
  };

  const handleLocationClick = () => {
    setShowLocationModal(true);
  };

  const banners = [
  {
    id: 1,
    title: 'Dairy and Bread',
    subtitle: 'Your favourite Bread is now online',
    buttonText: 'Shop Now',
    image: 'https://previews.123rf.com/images/yamix/yamix1106/yamix110600040/9830607-fresh-eggs-bread-and-dairy-products-in-glass-and-aluminum-containers.jpg',
    link: '/paan',
    size: 'third'
  },
  {
    id: 2,
    title: 'Pharmacy at your doorstep!',
    subtitle: 'Cough syrups, pain relief sprays & more',
    buttonText: 'Order Now',
    image: 'https://www.psghospitals.com/wp-content/uploads/2022/08/pharmacy.jpg',
    link: '/pharmacy',
    size: 'third'
  },
  {
    id: 4,
    title: 'Pet Care supplies in minutes',
    subtitle: 'Food, treats, toys & more',
    buttonText: 'Order Now',
    image: 'https://www.cubeoneapp.com/blog/wp-content/uploads/2023/03/Must-have-pet-care-essentials-for-dog-owners-1.png',
    link: '/petcare',
    size: 'third'
  },
  {
    id: 3,
    title: 'Groceries in minutes',
    subtitle: 'Fresh fruits, veggies & essentials',
    buttonText: 'Order Now',
    image: 'https://platform.vox.com/wp-content/uploads/sites/2/2025/02/groceryshopping.jpg?quality=90&strip=all&crop=0,10.732984293194,100,78.534031413613',
    link: '/groceries',
    size: 'full'
  }
];

  const categories = [
    
    { image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-2_10.png' },
    { image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-3_9.png' },
    { image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-4_9.png' },
    { image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-5_4.png' },
    { image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-6_5.png' },
    { image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-7_3.png' },
    { image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-8_4.png' },
    { image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-9_3.png' },
    { image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-10.png' },
    { image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-11.png' },
    { image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-12.png' },
    { image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-14.png' },
    { image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-15.png' },
    { image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-16.png' },
    { image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-17.png' },
    { image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-18.png' },
    { image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-19.png' },
    { image: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-20.png' },
    
  ];

  useEffect(() => {
    fetchLocation();
  }, []);

  return (
    <div className="App">
      {/* Enhanced Responsive Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-100">
        <div className="px-3 lg:px-6 py-3 lg:py-4">
          
          {/* Desktop Layout (lg and above) - Keep exactly the same */}
          <div className="hidden lg:flex items-center justify-between gap-4">
            {/* Left: Logo */}
            <div className="flex items-center gap-2 hover:scale-105 transition-transform duration-300 cursor-pointer flex-shrink-0">
              <img src={logo} className="h-10 sm:h-12" alt="logo" />
              <div className="flex gap-1 text-lg sm:text-xl font-bold">
                <span className="text-green-500">Blink</span>
                <span className="text-blue-500">Grocer</span>
              </div>
            </div>
            
            {/* Center: Location and Search */}
            <div className="flex items-center gap-3 flex-1 max-w-2xl">
              {/* Location Selector Pill */}
              <div
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-full shadow-md w-64 hover:bg-gray-200 transition-all duration-300 cursor-pointer flex-shrink-0"
                onClick={handleLocationClick}
                title="Click to change location"
                tabIndex="0"
              >
                <img src={locationIcon} alt="location" className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div className="flex flex-col flex-1 min-w-0">
                  {deliveryTime && (
                    <div className="text-xs font-semibold text-gray-800 leading-tight">
                      Delivery in {deliveryTime} min
                    </div>
                  )}
                  <div className="truncate text-gray-700 font-medium text-sm">
                    {isLocationLoading ? 'Updating...' : locationName}
                  </div>
                </div>
                <span className="text-green-500 text-xs ml-1">▼</span>
              </div>
              
              {/* Search Bar */}
              <input 
                type="text" 
                placeholder="Search for products..." 
                className="flex-1 px-4 py-2 rounded-full border border-gray-200 shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:outline-none transition-all duration-300"
              />
            </div>
            
            {/* Right: Login + Cart */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Cool Hover Effect Login Button */}
              <button 
                className="group relative h-12 w-32 overflow-hidden rounded-lg bg-white text-sm shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
                onClick={() => user ? navigate('/logout') : navigate('/auth')}
              >
                <div className="absolute inset-0 w-1 bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300 ease-out group-hover:w-full"></div>
                <span className="relative text-gray-700 font-semibold group-hover:text-white transition-colors duration-300">
                  {user ? 'Logout' : 'Login'}
                </span>
              </button>
              
              {/* Enhanced Cart Icon with Badge */}
              <div className="relative group">
                <div
                  className="relative p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 shadow-md hover:shadow-lg hover:from-green-50 hover:to-blue-50 hover:border-green-200 transition-all duration-300 cursor-pointer transform hover:scale-105"
                  onClick={() => navigate('/cart')}
                >
                  <img
                    src={cart}
                    className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
                    alt="cart"
                  />
                  {/* Animated Cart Badge */}
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full shadow-lg border-2 border-white animate-pulse">
                    0
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile/Tablet Layout (below lg) */}
          <div className="lg:hidden">
            {/* Top row: Logo + Hamburger */}
            <div className="flex items-center justify-between mb-4">
              {/* Logo - Smaller on mobile */}
              <div className="flex items-center gap-2 hover:scale-105 transition-transform duration-300 cursor-pointer">
                <img src={logo} className="h-6 w-6" alt="logo" />
                <div className="flex gap-1 text-base font-bold">
                  <span className="text-green-500">Blink</span>
                  <span className="text-blue-500">Grocer</span>
                </div>
              </div>
              
              {/* Flexible Animated Hamburger Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-400"
                aria-label="Toggle menu"
              >
                <div className="w-5 h-4 relative flex flex-col justify-between">
                  <span 
                    className={`block h-0.5 w-full bg-gray-700 dark:bg-gray-300 rounded-full transform transition-all duration-300 ease-in-out ${
                      isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                    }`}
                  ></span>
                  <span 
                    className={`block h-0.5 w-full bg-gray-700 dark:bg-gray-300 rounded-full transition-all duration-300 ease-in-out ${
                      isMobileMenuOpen ? 'opacity-0' : ''
                    }`}
                  ></span>
                  <span 
                    className={`block h-0.5 w-full bg-gray-700 dark:bg-gray-300 rounded-full transform transition-all duration-300 ease-in-out ${
                      isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                    }`}
                  ></span>
                </div>
              </button>
            </div>

            {/* Location + Search (always visible on mobile) */}
            <div className="flex flex-col space-y-4">
              {/* Location Selector - Full width, more compact */}
              <div
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl shadow-sm hover:bg-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-100"
                onClick={handleLocationClick}
                title="Click to change location"
                tabIndex="0"
              >
                <div className="p-2 bg-green-100 rounded-full">
                  <img src={locationIcon} alt="location" className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  {deliveryTime && (
                    <div className="text-xs font-semibold text-gray-800 leading-tight mb-0.5">
                      Delivery in {deliveryTime} min
                    </div>
                  )}
                  <div className="truncate text-gray-700 font-medium text-sm">
                    {isLocationLoading ? 'Updating...' : locationName}
                  </div>
                </div>
                <div className="p-1 bg-green-50 rounded-full">
                  <span className="text-green-600 text-sm">▼</span>
                </div>
              </div>
              
              {/* Search Bar - Full width, more compact */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Search for products..." 
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 shadow-sm placeholder-gray-400 text-gray-700 focus:ring-2 focus:ring-green-400 focus:border-green-400 focus:bg-white focus:outline-none transition-all duration-300 text-sm"
                />
              </div>
            </div>

            {/* Mobile Dropdown Menu - Only show when hamburger is clicked */}
            {isMobileMenuOpen && (
              <div className="mt-6 pt-6 pb-4 border-t border-gray-200 animate-in slide-in-from-top duration-300">
                <div className="flex flex-col space-y-4">
                  {/* Cool Mobile Login Button */}
                  <button 
                    className="group relative h-14 w-full overflow-hidden rounded-xl bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => {
                      user ? navigate('/logout') : navigate('/auth');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <div className="absolute inset-0 w-1 bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300 ease-out group-hover:w-full"></div>
                    <div className="relative flex items-center justify-center gap-2 h-full">
                      <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span className="font-semibold text-gray-700 group-hover:text-white transition-colors duration-300">
                        {user ? 'Logout' : 'Login'}
                      </span>
                    </div>
                  </button>
                  
                  {/* Enhanced Mobile Cart Button */}
                  <button
                    className="group flex items-center justify-between w-full px-6 py-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-green-50 hover:to-blue-50 border border-gray-200 hover:border-green-300 hover:scale-[1.02] transition-all duration-300 transform shadow-md hover:shadow-lg"
                    onClick={() => {
                      navigate('/cart');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-300">
                        <img src={cart} className="h-5 w-5" alt="cart" />
                      </div>
                      <span className="font-semibold text-gray-800 group-hover:text-gray-900">View Cart</span>
                    </div>
                    <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs w-7 h-7 flex items-center justify-center rounded-full shadow-md animate-pulse">
                      0
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="location-modal-overlay" onClick={() => setShowLocationModal(false)}>
          <div className="location-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Choose your Location</h2>
              <button className="close-btn" onClick={() => setShowLocationModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="location-options">
                <button 
                  className="detect-location-btn"
                  onClick={fetchLocation}
                  disabled={isLocationLoading}
                >
                  {isLocationLoading ? 'Detecting...' : 'Detect my location'}
                </button>
                <div className="or-divider">
                  <span>OR</span>
                </div>
                <div className="manual-location">
                  <input
                    type="text"
                    placeholder="search delivery location"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualLocation()}
                    className="location-search-input"
                  />
                </div>
                
                {/* Popular Locations */}
                <div className="popular-locations">
                  <h4>Popular Locations</h4>
                  {deliveryLocations.slice(0, 3).map((location) => (
                    <div 
                      key={location.id} 
                      className="location-item"
                      onClick={() => {
                        setLocationName(location.shortName);
                        setDeliveryTime(location.deliveryTime);
                        setShowLocationModal(false);
                      }}
                    >
                      <div className="location-details">
                        <div className="delivery-time-text">Delivery in {location.deliveryTime} minutes</div>
                        <div className="location-name">{location.name}</div>
                      </div>
                      <span className="location-arrow">→</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <hr className="header-divider" />

      {/* Banner Section */}
      <div className="banner-section">
  {banners.map((banner) => (
    <div
      key={banner.id}
      className={`banner-card ${banner.size}`}
      style={{ backgroundImage: `url(${banner.image})` }}
    >
      <div className="banner-content">
        <h2>{banner.title}</h2>
        <p>{banner.subtitle}</p>
        <button onClick={() => navigate(banner.link)}>
          {banner.buttonText}
        </button>
      </div>
    </div>
  ))}
</div>


      {/* Categories */}
      <div className="category-section" style={{ marginBottom: '50px' }}>
        <h2 className="category-title">Shop by Categories</h2>
        <div className="category-grid">
          {categories.map((item, index) => (
            <div
              className="category-card"
              key={index}
              onClick={() => navigate(`/category/${item.path}`)}
            >
              <img src={item.image} alt={item.name} className="category-image" />
              <p className="category-name">{item.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
