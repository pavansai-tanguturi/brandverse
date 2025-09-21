import React from 'react';


const Footer = () => (
  <footer className="bg-gradient-to-r from-blue-700 to-purple-700 text-white py-10 mt-12 shadow-inner">
    <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
      <div className="flex flex-col items-center md:items-start w-full md:w-auto text-center md:text-left">
        <span className="text-2xl font-bold tracking-tight mb-2">BrandVerse</span>
        <span className="text-sm text-blue-100 mb-2">Your trusted daily essentials store</span>
        <span className="text-xs text-blue-200 mb-2">Serving Hyderabad, Telangana, India</span>
        <span className="text-xs text-blue-200 mb-2">Contact: <a href="tel:+919999999999" className="underline hover:text-blue-300">+91 99999 99999</a> | <a href="mailto:support@brandverse.com" className="underline hover:text-blue-300">support@brandverse.com</a></span>
        <div className="flex gap-4 mt-2 justify-center md:justify-start">
          <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-pink-300 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" strokeWidth="2"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" strokeWidth="2"/><line x1="17.5" y1="6.5" x2="17.5" y2="6.5" strokeWidth="2"/></svg>
          </a>
          <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-blue-300 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a4 4 0 0 0-4 4v3H7v4h4v8h4v-8h3l1-4h-4V6a1 1 0 0 1 1-1h3z" strokeWidth="2"/></svg>
          </a>
          <a href="mailto:support@brandverse.com" aria-label="Email" className="hover:text-yellow-300 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4h16v16H4z" strokeWidth="2"/><polyline points="22,6 12,13 2,6" strokeWidth="2"/></svg>
          </a>
        </div>
      </div>
      <div className="flex flex-col items-center md:items-end gap-2 w-full md:w-auto text-center md:text-right mt-8 md:mt-0">
        <nav className="flex flex-wrap justify-center md:justify-end gap-4 text-sm mb-2">
          <a href="/about" className="hover:underline hover:text-blue-200">About Us</a>
          <a href="/contact" className="hover:underline hover:text-blue-200">Contact</a>
          <a href="/privacy" className="hover:underline hover:text-blue-200">Privacy Policy</a>
          <a href="/terms" className="hover:underline hover:text-blue-200">Terms</a>
        </nav>
        <span className="text-xs text-blue-100">&copy; {new Date().getFullYear()} BrandVerse. All rights reserved.</span>
        <span className="text-xs text-blue-200">Made with ❤️ in Bhimavaram</span>
      </div>
    </div>
  </footer>
);

export default Footer;