import React from 'react';
import { Link } from 'react-router-dom';

const SideNav = ({ isOpen, onClose }) => {
  return (
    <div className={`fixed inset-0 z-40 ${isOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isOpen}>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">Admin Menu</h2>
          <button onClick={onClose} className="text-gray-600 px-2 py-1 rounded hover:bg-gray-100">✕</button>
        </div>
        <nav className="p-4 space-y-2">
          <Link to="/admin/dashboard" onClick={onClose} className="block px-3 py-2 rounded hover:bg-gray-100">Dashboard</Link>
          <Link to="/admin/products" onClick={onClose} className="block px-3 py-2 rounded hover:bg-gray-100">Products</Link>
          <Link to="/admin/orders" onClick={onClose} className="block px-3 py-2 rounded hover:bg-gray-100">Orders</Link>
          <Link to="/admin/users" onClick={onClose} className="block px-3 py-2 rounded hover:bg-gray-100">Users</Link>
          <Link to="/admin/logout" onClick={onClose} className="block px-3 py-2 rounded text-red-600 hover:bg-red-50">Logout</Link>
        </nav>
      </aside>
    </div>
  );
};

export default SideNav;
