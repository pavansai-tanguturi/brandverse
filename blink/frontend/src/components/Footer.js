import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logos.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="hidden lg:block bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900 text-white mt-auto">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand Section */}
          <div>
            <Link to="/" className="inline-block mb-4">
              <img
                src={logo}
                className="h-12 w-auto object-contain rounded-lg bg-white/10 p-1"
                alt="AkepatiMart"
              />
            </Link>
            <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              AkepatiMart
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              Your trusted online marketplace for quality products at the best prices.
            </p>
            <div className="flex space-x-3">
              {['Facebook', 'Twitter', 'Instagram', 'YouTube'].map((platform) => (
                <a
                  key={platform}
                  href={`https://${platform.toLowerCase()}.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-white/10 hover:bg-emerald-500 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                  aria-label={platform}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d={getIconPath(platform)} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-emerald-400">Quick Links</h4>
            <ul className="space-y-2">
              {['Home', 'All Products', 'Categories', 'About Us', 'Contact Us', 'Blog'].map((item) => (
                <li key={item}>
                  <Link
                    to={getLinkPath(item)}
                    className="text-gray-300 hover:text-emerald-400 transition-colors duration-200 flex items-center group text-sm"
                  >
                    <svg className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-emerald-400">Customer Service</h4>
            <ul className="space-y-2">
              {['My Account', 'Order Tracking', 'Wishlist', 'Help Center', 'FAQ', 'Returns & Refunds'].map((item) => (
                <li key={item}>
                  <Link
                    to={getServiceLink(item)}
                    className="text-gray-300 hover:text-emerald-400 transition-colors duration-200 flex items-center group text-sm"
                  >
                    <svg className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-emerald-400">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-3 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="text-gray-300 text-sm">
                  <p className="font-semibold text-white mb-1">Address</p>
                  <p>123 Shopping Street,</p>
                  <p>Hyderabad, Telangana 500001</p>
                  <p>India</p>
                </div>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-3 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div className="text-gray-300 text-sm">
                  <p className="font-semibold text-white mb-1">Phone</p>
                  <a href="tel:+919876543210" className="hover:text-emerald-400 transition-colors">+91 98765 43210</a>
                </div>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-3 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="text-gray-300 text-sm">
                  <p className="font-semibold text-white mb-1">Email</p>
                  <a href="mailto:support@akepatimart.com" className="hover:text-emerald-400 transition-colors">support@akepatimart.com</a>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Methods & Certifications */}
      <div className="border-t border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h5 className="text-sm font-semibold text-emerald-400 mb-3">We Accept</h5>
              <div className="flex items-center space-x-3">
                {['VISA', 'Mastercard', 'UPI', 'COD', 'Net Banking'].map((method) => (
                  <div key={method} className="bg-white rounded px-3 py-1.5 shadow-md">
                    <span className="text-xs font-bold text-gray-700">{method}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/10 rounded px-3 py-1.5">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
                <span className="text-xs font-medium">SSL Secured</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 bg-black/20 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400 text-center md:text-left">
              <p>© {currentYear} <span className="text-emerald-400 font-semibold">AkepatiMart</span>. All rights reserved.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              {['Privacy Policy', 'Terms & Conditions', 'Shipping Policy', 'Cookie Policy', 'Sitemap'].map((item) => (
                <React.Fragment key={item}>
                  <Link to={getPolicyLink(item)} className="text-gray-400 hover:text-emerald-400 transition-colors text-sm">
                    {item}
                  </Link>
                  {item !== 'Sitemap' && <span className="text-gray-600">•</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white p-3 rounded-full shadow-2xl hover:shadow-emerald-500/50 transition-all duration-200 hover:scale-105 z-40"
        aria-label="Back to top"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </footer>
  );
};

// Helper functions for dynamic paths and icons
const getLinkPath = (item) => {
  const paths = {
    'Home': '/',
    'All Products': '/products',
    'Categories': '/categories',
    'About Us': '/about',
    'Contact Us': '/contact',
    'Blog': '/blog',
  };
  return paths[item] || '/';
};

const getServiceLink = (item) => {
  const paths = {
    'My Account': '/dashboard',
    'Order Tracking': '/dashboard?tab=orders',
    'Wishlist': '/dashboard?tab=wishlist',
    'Help Center': '/help',
    'FAQ': '/faq',
    'Returns & Refunds': '/returns',
  };
  return paths[item] || '/';
};

const getPolicyLink = (item) => {
  const paths = {
    'Privacy Policy': '/privacy-policy',
    'Terms & Conditions': '/terms-conditions',
    'Shipping Policy': '/shipping-policy',
    'Cookie Policy': '/cookie-policy',
    'Sitemap': '/sitemap',
  };
  return paths[item] || '/';
};

const getIconPath = (platform) => {
  const icons = {
    'Facebook': 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
    'Twitter': 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z',
    'Instagram': 'M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.913 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z',
    'YouTube': 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  };
  return icons[platform] || '';
};

export default Footer;
