import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useReactToPrint } from 'react-to-print';
import { format, subDays } from 'date-fns';
import AdminNav from '../../components/admin/AdminNav';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState({
    summary: {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      totalProducts: 0,
      revenueGrowth: 0,
      averageOrderValue: 0
    },
    dailyRevenue: [],
    monthlyRevenue: [],
    yearlyRevenue: [],
    categoryRevenue: [],
    topProducts: [],
    orderStatus: [],
    dateRange: {
      start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    }
  });
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('daily');
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [exportLoading, setExportLoading] = useState(false);
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Analytics Report - ${dateRange.start} to ${dateRange.end}`,
  });

  const fetchAnalytics = async () => {
    setError('');
    setIsRefreshing(true);
    try {
      const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
      
      const res = await fetch(`${API_BASE}/api/admin/analytics/summary?startDate=${dateRange.start}&endDate=${dateRange.end}`, {
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        const timeBasedData = generateTimeBasedData(data.dailyRevenue || []);
        setAnalytics(prevData => ({
          ...prevData,
          ...data,
          monthlyRevenue: timeBasedData.monthly,
          yearlyRevenue: timeBasedData.yearly
        }));
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to fetch analytics' }));
        setError(errorData.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportData = async (format) => {
    setExportLoading(true);
    try {
      const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
      
      const res = await fetch(`${API_BASE}/api/admin/analytics/export?format=${format}&startDate=${dateRange.start}&endDate=${dateRange.end}`, {
        credentials: 'include'
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${dateRange.start}-to-${dateRange.end}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to export data');
      }
    } catch (err) {
      setError(err.message || 'Failed to export data');
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange.start, dateRange.end]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatCurrency = (value) => `₹${(value || 0).toFixed(2)}`;
  const formatNumber = (value) => (value || 0).toLocaleString();

  const generateTimeBasedData = (dailyData) => {
    if (!dailyData || dailyData.length === 0) return { monthly: [], yearly: [] };

    const monthlyMap = {};
    const yearlyMap = {};

    dailyData.forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const yearKey = String(date.getFullYear());

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, revenue: 0 };
      }
      monthlyMap[monthKey].revenue += item.revenue || 0;

      if (!yearlyMap[yearKey]) {
        yearlyMap[yearKey] = { year: yearKey, revenue: 0 };
      }
      yearlyMap[yearKey].revenue += item.revenue || 0;
    });

    return {
      monthly: Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month)),
      yearly: Object.values(yearlyMap).sort((a, b) => a.year.localeCompare(b.year))
    };
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="flex items-center justify-center p-6">
          <div className="text-center bg-white rounded-lg shadow-sm p-8">
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <button 
              onClick={fetchAnalytics}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="min-h-screen bg-gray-50" style={{ paddingTop: '64px' }}>
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div ref={componentRef} className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                  {isRefreshing && (
                    <div className="flex items-center text-blue-600">
                      <svg className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="ml-2 text-sm">Updating...</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-600 mt-1">Business insights and performance metrics</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {/* View Mode Selector */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('daily')}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      viewMode === 'daily' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setViewMode('monthly')}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      viewMode === 'monthly' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setViewMode('yearly')}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      viewMode === 'yearly' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Yearly
                  </button>
                </div>
                
                {/* Date Range */}
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <span className="text-gray-500 text-sm font-medium">to</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                
                {/* Export Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"></path>
                    </svg>
                    PDF
                  </button>
                  <button
                    onClick={() => exportData('json')}
                    disabled={exportLoading}
                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-200 disabled:bg-green-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    JSON
                  </button>
                  <button
                    onClick={() => exportData('csv')}
                    disabled={exportLoading}
                    className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 focus:ring-4 focus:ring-orange-200 disabled:bg-orange-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards with SVG Icons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Revenue */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-xl">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(analytics?.summary?.totalRevenue || 0)}
                  </p>
                  <div className="flex items-center mt-1">
                    <svg className={`w-3 h-3 mr-1 ${(analytics?.summary?.revenueGrowth || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={analytics?.summary?.revenueGrowth >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                    </svg>
                    <span className={`text-xs font-medium ${(analytics?.summary?.revenueGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(analytics?.summary?.revenueGrowth || 0).toFixed(1)}% vs prev period
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatNumber(analytics?.summary?.totalOrders || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Avg: {formatCurrency(analytics?.summary?.averageOrderValue || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Customers - Your Custom SVG */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <svg className="w-8 h-8 text-purple-600" viewBox="0 0 119 119" fill="none">
                    <path d="M91.8626 99.2222H94.2727C99.9259 99.2222 104.423 96.6464 108.46 93.0449C118.717 83.895 94.6061 74.6389 86.3751 74.6389M76.5417 25.8103C77.6583 25.5889 78.8177 25.4722 80.007 25.4722C88.9549 25.4722 96.2084 32.076 96.2084 40.2222C96.2084 48.3684 88.9549 54.9722 80.007 54.9722C78.8177 54.9722 77.6583 54.8557 76.5417 54.634" stroke="currentColor" strokeWidth="8.5" strokeLinecap="round"/>
                    <path d="M22.3666 80.1023C16.57 83.2086 1.3716 89.5516 10.6284 97.4886C15.1503 101.366 20.1866 104.139 26.5183 104.139H62.6488C68.9805 104.139 74.0166 101.366 78.5385 97.4886C87.7956 89.5516 72.5972 83.2086 66.8004 80.1023C53.2073 72.8178 35.9596 72.8178 22.3666 80.1023Z" stroke="currentColor" strokeWidth="8.5"/>
                    <path d="M64.2501 37.7639C64.2501 48.6255 55.4448 57.4306 44.5834 57.4306C33.7218 57.4306 24.9167 48.6255 24.9167 37.7639C24.9167 26.9023 33.7218 18.0972 44.5834 18.0972C55.4448 18.0972 64.2501 26.9023 64.2501 37.7639Z" stroke="currentColor" strokeWidth="8.5"/>
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatNumber(analytics?.summary?.totalCustomers || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Active users</p>
                </div>
              </div>
            </div>

            {/* Active Products - Your Custom Box SVG */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-xl">
                  <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.73 16.52C20.73 16.52 20.73 16.45 20.73 16.41V7.58999C20.7297 7.47524 20.7022 7.36218 20.65 7.25999C20.5764 7.10119 20.4488 6.97364 20.29 6.89999L12.29 3.31999C12.1926 3.2758 12.0869 3.25293 11.98 3.25293C11.8731 3.25293 11.7674 3.2758 11.67 3.31999L3.67001 6.89999C3.54135 6.96474 3.43255 7.06303 3.35511 7.18448C3.27766 7.30592 3.23444 7.44603 3.23001 7.58999V16.41C3.23749 16.5532 3.28195 16.6921 3.35906 16.813C3.43617 16.9339 3.54331 17.0328 3.67001 17.1L11.67 20.68C11.7668 20.7262 11.8727 20.7501 11.98 20.7501C12.0873 20.7501 12.1932 20.7262 12.29 20.68L20.29 17.1C20.4055 17.0471 20.5061 16.9665 20.5829 16.8653C20.6597 16.7641 20.7102 16.6455 20.73 16.52ZM4.73001 8.73999L11.23 11.66V18.84L4.73001 15.93V8.73999ZM12.73 11.66L19.23 8.73999V15.93L12.73 18.84V11.66ZM12 4.81999L18.17 7.58999L12 10.35L5.83001 7.58999L12 4.81999Z" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Active Products</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatNumber(analytics?.summary?.totalProducts || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">In catalog</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            {/* Revenue Trend Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                  {viewMode === 'daily' && 'Daily'}
                  {viewMode === 'monthly' && 'Monthly'}
                  {viewMode === 'yearly' && 'Yearly'}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={
                  viewMode === 'daily' ? analytics?.dailyRevenue || [] :
                  viewMode === 'monthly' ? analytics?.monthlyRevenue || [] :
                  analytics?.yearlyRevenue || []
                }>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey={viewMode === 'yearly' ? 'year' : viewMode === 'monthly' ? 'month' : 'date'} 
                  />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Category Revenue Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Revenue by Category</h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                  Performance
                </span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.categoryRevenue || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            {/* Order Status Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics?.orderStatus || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count, percent }) => `${status}: ${count} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(analytics?.orderStatus || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
              <div className="space-y-3">
                {(analytics?.topProducts || []).length > 0 ? (
                  (analytics?.topProducts || []).slice(0, 5).map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.title}</p>
                          <p className="text-sm text-gray-500">{product.quantity} units sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No product data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-gray-500 text-sm">
              Report generated on {format(new Date(), 'PPP')} • Period: {dateRange.start} to {dateRange.end}
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;