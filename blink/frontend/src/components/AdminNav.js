import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SideNav from './SideNav';

const AdminNav = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <SideNav isOpen={open} onClose={() => setOpen(false)} />
      <header className="bg-white shadow sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button className="sm:hidden mr-3 p-2 rounded hover:bg-gray-100" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
              <h1 className="text-xl font-bold text-blue-700 mr-6">Brandverse Admin</h1>
              <nav className="hidden sm:flex space-x-3">
                <Link to="/admin/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700">Dashboard</Link>
                <Link to="/admin/products" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700">Products</Link>
                <Link to="/admin/orders" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700">Orders</Link>
                <Link to="/admin/analytics" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700">Analytics</Link>
                <Link to="/admin/users" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700">Users</Link>
              </nav>
            </div>
            <div className="flex items-center">
              <Link to="/admin/logout" className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100">Logout</Link>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default AdminNav;
