import React, { useState } from "react";
import { Link } from "react-router-dom";

const AdminNav = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      {/* Top Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle sidebar"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <Link
              to="/admin/dashboard"
              className="ml-3 text-xl font-bold text-blue-700"
            >
              Akepatimart Admin
            </Link>
          </div>

          <div className="flex items-center">
            <Link
              to="/admin/logout"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-600 rounded-md hover:bg-red-50"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </Link>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-blue-700">Admin Panel</h2>
          <button
            onClick={closeSidebar}
            className="p-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {/* Dashboard */}
          <Link
            to="/admin/dashboard"
            onClick={closeSidebar}
            className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Dashboard
          </Link>

          {/* Analytics */}
          <Link
            to="/admin/analytics"
            onClick={closeSidebar}
            className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Analytics
          </Link>

          {/* Categories */}
          {/* <Link 
            to="/admin/categories" 
            onClick={closeSidebar}
            className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Categories
          </Link> */}

          {/* Products */}
          <Link
            to="/admin/products"
            onClick={closeSidebar}
            className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            Products
          </Link>

          {/* Orders */}
          <Link
            to="/admin/orders"
            onClick={closeSidebar}
            className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Orders
          </Link>

          {/* Users/Customers */}
          <Link
            to="/admin/users"
            onClick={closeSidebar}
            className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-3"
              stroke="currentColor"
              viewBox="0 0 119 119"
              fill="none"
            >
              <path
                d="M91.8626 99.2222H94.2727C99.9259 99.2222 104.423 96.6464 108.46 93.0449C118.717 83.895 94.6061 74.6389 86.3751 74.6389M76.5417 25.8103C77.6583 25.5889 78.8177 25.4722 80.007 25.4722C88.9549 25.4722 96.2084 32.076 96.2084 40.2222C96.2084 48.3684 88.9549 54.9722 80.007 54.9722C78.8177 54.9722 77.6583 54.8557 76.5417 54.634"
                stroke="currentColor"
                strokeWidth="8.5"
                strokeLinecap="round"
              />
              <path
                d="M22.3666 80.1023C16.57 83.2086 1.3716 89.5516 10.6284 97.4886C15.1503 101.366 20.1866 104.139 26.5183 104.139H62.6488C68.9805 104.139 74.0166 101.366 78.5385 97.4886C87.7956 89.5516 72.5972 83.2086 66.8004 80.1023C53.2073 72.8178 35.9596 72.8178 22.3666 80.1023Z"
                stroke="currentColor"
                strokeWidth="8.5"
              />
              <path
                d="M64.2501 37.7639C64.2501 48.6255 55.4448 57.4306 44.5834 57.4306C33.7218 57.4306 24.9167 48.6255 24.9167 37.7639C24.9167 26.9023 33.7218 18.0972 44.5834 18.0972C55.4448 18.0972 64.2501 26.9023 64.2501 37.7639Z"
                stroke="currentColor"
                strokeWidth="8.5"
              />
            </svg>
            Customers
          </Link>

          {/* Banners */}
          <Link
            to="/admin/banners"
            onClick={closeSidebar}
            className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <rect
                x="3"
                y="7"
                width="18"
                height="10"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="2" />
            </svg>
            Banners
          </Link>

          {/* Delivery Locations */}
          <Link
            to="/admin/delivery-locations"
            onClick={closeSidebar}
            className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Delivery Locations
          </Link>

          <div className="border-t border-gray-200 my-4"></div>

          {/* Logout */}
          <Link
            to="/admin/logout"
            onClick={closeSidebar}
            className="flex items-center px-3 py-2 text-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </Link>
        </nav>
      </aside>
    </>
  );
};

export default AdminNav;
