// src/pages/Home.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logos.png';
import cart from '../assets/cart.png';
import locationIcon from '../assets/location.png';
import '../styles/App.css';

function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [locationName, setLocationName] = useState('Fetching location...');
  const sliderRefs = useRef({});

  const scroll = (category, direction) => {
    const slider = sliderRefs.current[category];
    if (slider) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const banners = [
    {
      id: 1,
      title: 'Dairy and Bread',
      subtitle: 'Your favourite Bread is now online',
      buttonText: 'Shop Now',
      image:
        'https://previews.123rf.com/images/yamix/yamix1106/yamix110600040/9830607-fresh-eggs-bread-and-dairy-products-in-glass-and-aluminum-containers.jpg',
      link: '/paan',
      size: 'third',
    },
    {
      id: 2,
      title: 'Pharmacy at your doorstep!',
      subtitle: 'Cough syrups, pain relief sprays & more',
      buttonText: 'Order Now',
      image: 'https://www.psghospitals.com/wp-content/uploads/2022/08/pharmacy.jpg',
      link: '/pharmacy',
      size: 'third',
    },
    {
      id: 4,
      title: 'Pet Care supplies in minutes',
      subtitle: 'Food, treats, toys & more',
      buttonText: 'Order Now',
      image:
        'https://www.cubeoneapp.com/blog/wp-content/uploads/2023/03/Must-have-pet-care-essentials-for-dog-owners-1.png',
      link: '/petcare',
      size: 'third',
    },
    {
      id: 3,
      title: 'Groceries in minutes',
      subtitle: 'Fresh fruits, veggies & essentials',
      buttonText: 'Order Now',
      image:
        'https://platform.vox.com/wp-content/uploads/sites/2/2025/02/groceryshopping.jpg?quality=90&strip=all&crop=0,10.732984293194,100,78.534031413613',
      link: '/groceries',
      size: 'full',
    },
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

  const products = {
    groceries: [
      { id: 1, name: 'Fresh Apples', price: '₹120/kg', image: 'https://www.foodandwine.com/thmb/ozENq23ZVI5_28hMhKDlzk42bVU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/Apples-2000-b2f9fdb866fe4ca59a195782468816d1.jpg' },
      { id: 2, name: 'Bananas', price: '₹60/dozen', image: 'https://blog-images-1.pharmeasy.in/blog/production/wp-content/uploads/2021/01/30152155/shutterstock_518328943-1.jpg' },
      { id: 3, name: 'Tomatoes', price: '₹40/kg', image: 'https://images-prod.healthline.com/hlcmsresource/images/AN_images/tomatoes-1296x728-feature.jpg' },
      { id: 4, name: 'Potatoes', price: '₹30/kg', image: 'https://images.ctfassets.net/0dkgxhks0leg/RKiZ605RAV8kjDQnxFCWP/b03b8729817c90b29b88d536bfd37ac5/9-Unusual-Uses-For-Potatoes.jpg' },
      { id: 5, name: 'Onions', price: '₹35/kg', image: 'https://cdn.shopify.com/s/files/1/1375/4957/files/blog_img_6.jpg?v=1573206246' },
      { id: 6, name: 'Carrots', price: '₹50/kg', image: 'https://www.trustbasket.com/cdn/shop/articles/Carrot.jpg?v=1688378789' },
      { id: 7, name: 'Cucumbers', price: '₹45/kg', image: 'https://www.greendna.in/cdn/shop/products/cucumber_1_700x.jpg?v=1594219681' },
    ],
    dairy: [
      { id: 8, name: 'Amul Milk 1L', price: '₹52', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqzRUNqNA_DxnOXCYbDvBj682zm13PqPg6XA&s' },
      { id: 9, name: 'Brown Bread', price: '₹45', image: 'https://www.tasteofhome.com/wp-content/uploads/2024/10/Old-Fashioned-Brown-Bread_EXPS_TOHcom24_44465_MD_P2_09_24_1b.jpg' },
      { id: 10, name: 'Cheddar Cheese', price: '₹150', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPe5deObk0SMVxdvR0Skdi1fU9iZsE3Sdf7A&s' },
      { id: 11, name: 'Butter', price: '₹120', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNeo7IWcaO83X0HZRHSymZ2eTJd8KwVwT5iQ&s' },
      { id: 12, name: 'Curd', price: '₹60/kg', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTY-M6LTcy2Wli8uis37Or4dzjo2tx2SIphlQ&s' },
      { id: 13, name: 'Paneer', price: '₹280/kg', image: 'https://images.squarespace-cdn.com/content/v1/5ea3b22556f3d073f3d9cae4/9d9780d0-cbb9-4c4f-b8e7-d19759e30c5c/IMG_4064.jpg' },
      { id: 14, name: 'Eggs (12 pack)', price: '₹75', image: 'https://media.post.rvohealth.io/wp-content/uploads/2020/09/health-benefits-of-eggs-732x549-thumbnail-732x549.jpg' },
    ],
    pharmacy: [
      { id: 15, name: 'Paracetamol', price: '₹30', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQOrgBqvsxYVtMkx35xvOO_dLLo2D1X4dnPxQ&s' },
      { id: 16, name: 'Cough Syrup', price: '₹120', image: 'https://ayushcare.in/cdn/shop/products/Benadrylcoughsyup.jpg?v=1747141247' },
      { id: 17, name: 'Pain Relief Spray', price: '₹150', image: 'https://m.media-amazon.com/images/I/51o0JbVzRzL.jpg' },
      { id: 18, name: 'Vitamin C Tablets', price: '₹200', image: 'https://m.media-amazon.com/images/I/61mtSUqOhdS.jpg' },
      { id: 19, name: 'Hand Sanitizer', price: '₹50', image: 'https://assets.unileversolutions.com/v1/34829171.jpg' },
      { id: 20, name: 'First Aid Kit', price: '₹350', image: 'https://images.ctfassets.net/58z2odx42k4g/5sqYIPvyZVmzp3xzlwJy89/6654c685bd39fa4d7bccbd3fb297f529/bab_381372020453_us_jnj_all-purpose_first_aid_kit_160ct_00000-en-us' },
      { id: 21, name: 'Thermometer', price: '₹180', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtsLCBD9bA2UV02Qf6TmFdXtOV_TVzVOg7Tw&s' },
    ],
  };


  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            setLocationName(
              data.address.city ||
                data.address.town ||
                data.address.village ||
                'Unknown location'
            );
          } catch (error) {
            console.error('Error fetching location name:', error);
            setLocationName('Location unavailable');
          }
        },
        () => {
          setLocationName('Location permission denied');
        }
      );
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

        <button
          className="login-button"
          onClick={() => (user ? navigate('/logout') : navigate('/auth'))}
        >
          {user ? 'Logout' : 'Login'}
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
              <button onClick={() => navigate(banner.link)}>{banner.buttonText}</button>
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

      {/* Products Section */}
      <div className="product-section">
        <h2 className="product-title">Popular Products</h2>

        {Object.keys(products).map((category) => (
          <div key={category} className="product-category">
            <h3 className="product-category-title">{category.toUpperCase()}</h3>

            <div className="slider-container">
              <button className="slider-btn left" onClick={() => scroll(category, 'left')}>
                ◀
              </button>

              <div className="product-slider" ref={(el) => (sliderRefs.current[category] = el)}>
                {products[category].map((product) => (
                  <div key={product.id} className="product-card">
                    <img src={product.image} alt={product.name} className="product-image" />
                    <h4>{product.name}</h4>
                    <p>{product.price}</p>
                    <div className="product-actions">
                      <button className="wishlist" onClick={() => alert(`Added ${product.name} to Wishlist`)}>
                        ❤️
                      </button>
                      <button className="cart" onClick={() => alert(`Added ${product.name} to Cart`)}>
                        🛒
                      </button>
                      <button className="details" onClick={() => navigate(`/product/${product.id}`)}>
                        ℹ️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="slider-btn right" onClick={() => scroll(category, 'right')}>
                ▶
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
