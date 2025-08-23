import React, { useEffect, useState } from 'react';
import AdminNav from '../components/AdminNav';

const AdminDashboard = () => {
  const [summary, setSummary] = useState({
    total_sales: 0,
    order_count: 0,
    avg_order_value: 0,
    top_products: [],
    low_stock: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
        const token = localStorage.getItem('adminToken');
        
        // Add timeout to prevent long waits
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const res = await fetch(`${API_BASE}/api/admin/analytics/summary`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const text = await res.text();
        if (!res.ok) {
          console.warn(`Analytics API failed: ${res.status} - showing placeholder data`);
          return;
        }
        try {
          const data = JSON.parse(text);
          setSummary(data);
        } catch (err) {
          console.warn('Analytics API returned invalid JSON - showing placeholder data');
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          console.warn('Analytics API timeout - showing placeholder data');
        } else {
          console.warn('Analytics API error - showing placeholder data');
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Optional: Only fetch analytics if needed, otherwise show placeholder immediately
    const shouldSkipAnalytics = localStorage.getItem('skipAnalytics') === 'true';
    if (!shouldSkipAnalytics) {
      fetchSummary();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav />
      <div className="max-w-4xl mx-auto mt-10 p-8 bg-white rounded shadow-md">
        <h2 className="text-3xl font-bold mb-6 text-blue-700">Admin Dashboard</h2>
        {loading && (
          <div className="flex items-center justify-center py-4 mb-4">
            <div className="relative">
              <div className="w-8 h-8 border-2 border-blue-200 rounded-full animate-spin"></div>
              <div className="absolute top-0 left-0 w-8 h-8 border-2 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <p className="text-blue-600 ml-3">Updating data...</p>
          </div>
        )}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded shadow">
              <p className="text-lg font-semibold">Total Sales</p>
              <p className="text-2xl text-blue-700">₹{(summary.total_sales / 100).toFixed(2)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded shadow">
              <p className="text-lg font-semibold">Order Count</p>
              <p className="text-2xl text-green-700">{summary.order_count}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded shadow">
              <p className="text-lg font-semibold">Avg Order Value</p>
              <p className="text-2xl text-yellow-700">₹{(summary.avg_order_value / 100).toFixed(2)}</p>
            </div>
          </div>
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2 text-blue-600">Top Products</h3>
            {summary.top_products.length > 0 ? (
              <ul className="list-disc pl-6">
                {summary.top_products.map(p => (
                  <li key={p.product_id} className="mb-1">{p.title} <span className="text-gray-500">- {p.qty} sold</span></li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No sales data available yet</p>
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2 text-red-600">Low Stock Products</h3>
            {summary.low_stock.length > 0 ? (
              <ul className="list-disc pl-6">
                {summary.low_stock.map(p => (
                  <li key={p.id} className="mb-1">{p.title} <span className="text-gray-500">- {p.stock_quantity} left</span></li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">All products are well stocked</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
