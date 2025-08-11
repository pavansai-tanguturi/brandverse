// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../logos.png';
import cart from '../cart.png';
import locationIcon from '../location.png';
import '../App.css';

function Home() {
  const navigate = useNavigate();
  const [locationName, setLocationName] = useState('Fetching location...');

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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          setLocationName(data.address.city || data.address.town || data.address.village || 'Unknown location');
        } catch (error) {
          console.error('Error fetching location name:', error);
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
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />

        <div
          className="location-container"
          onClick={() =>
            window.open(`https://www.google.com/maps/place/${locationName}`, '_blank')
          }
        >
          <img src={locationIcon} alt="location" className="location-icon" />
          <span className="location-text">{locationName}</span>
        </div>

        <div className="search-container">
          <input type="text" placeholder="Search..." className="search-input" />
        </div>

        <button className="login-button" onClick={() => navigate('/login')}>
          Login
        </button>

        <img
          src={cart}
          className="cart-icon"
          alt="cart"
          onClick={() => navigate('/cart')}
        />
      </header>

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
