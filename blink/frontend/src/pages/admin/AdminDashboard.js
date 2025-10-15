import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import AdminNav from "../../components/admin/AdminNav";
import { useAuth } from "../../context/AuthContext";

// Constants
const API_TIMEOUT = 10000;
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAYS = [3000, 6000];

// Initial state
const INITIAL_SUMMARY = {
  totalRevenue: 0,
  totalOrders: 0,
  averageOrderValue: 0,
  totalCustomers: 0,
  totalProducts: 0,
  activeProducts: 0,
  monthlyRevenue: 0,
  weeklyRevenue: 0,
  todayOrders: 0,
  pendingOrders: 0,
  lowStockProducts: 0,
  recentCustomers: 0,
  topProducts: [],
  orderStatus: [],
  revenueGrowth: 0,
  orderGrowth: 0,
};

// Status colors mapping
const STATUS_COLORS = {
  completed: "bg-green-100 text-green-800 border-green-400",
  shipped: "bg-blue-100 text-blue-800 border-blue-400",
  processing: "bg-yellow-100 text-yellow-800 border-yellow-400",
  pending: "bg-orange-100 text-orange-800 border-orange-400",
  cancelled: "bg-red-100 text-red-800 border-red-400",
  default: "bg-gray-100 text-gray-800 border-gray-400",
};

// Quick actions configuration
const QUICK_ACTIONS = [
  {
    to: "/admin/analytics",
    title: "Analytics Dashboard",
    description: "View detailed reports & insights",
    color: "blue",
    icon: "M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z",
  },
  {
    to: "/admin/products",
    title: "Manage Products",
    description: "Add, edit & organize products",
    color: "green",
    icon: "M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 15a1 1 0 01-1-1v-3a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H8z",
  },
  {
    to: "/admin/orders",
    title: "View Orders",
    description: "Manage customer orders",
    color: "orange",
    icon: "M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z",
  },
  {
    to: "/admin/users",
    title: "Manage Customers",
    description: "View customer tiers & details",
    color: "purple",
    icon: "M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z",
  },
];

// Utility functions
const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value || 0);
};

const formatPercentage = (value) => `${(value || 0).toFixed(1)}%`;

const getStatusColor = (status) =>
  STATUS_COLORS[status] || STATUS_COLORS.default;

const getErrorMessage = (error) => {
  if (error.name === "AbortError") {
    return "Request timed out. Please check your connection.";
  }
  if (error.message.includes("Failed to fetch")) {
    return "Unable to connect to server. Please check if the backend is running.";
  }
  return `API Error: ${error.message}`;
};

// Data transformation function
const transformApiData = (data) => {
  if (!data) return INITIAL_SUMMARY;

  const { summary, dailyRevenue, topProducts, orderStatus } = data;

  return {
    totalRevenue: summary?.totalRevenue || 0,
    totalOrders: summary?.totalOrders || 0,
    averageOrderValue: summary?.averageOrderValue || 0,
    totalCustomers: summary?.totalCustomers || 0,
    totalProducts: summary?.totalProducts || 0,
    activeProducts: summary?.totalProducts || 0,
    monthlyRevenue: summary?.totalRevenue || 0,
    weeklyRevenue: (summary?.totalRevenue || 0) * 0.25,
    todayOrders: dailyRevenue?.[dailyRevenue.length - 1]?.orders || 0,
    pendingOrders: orderStatus?.find((s) => s.status === "pending")?.count || 0,
    lowStockProducts: 0,
    recentCustomers: Math.floor((summary?.totalCustomers || 0) * 0.1),
    revenueGrowth: summary?.revenueGrowth || 0,
    orderGrowth: 0,
    topProducts: Array.isArray(topProducts) ? topProducts : [],
    orderStatus: Array.isArray(orderStatus)
      ? orderStatus.map((status) => ({
          ...status,
          percentage:
            summary?.totalOrders > 0
              ? ((status.count / summary.totalOrders) * 100).toFixed(1)
              : 0,
        }))
      : [],
  };
};

// Component parts
const MetricCard = React.memo(
  ({ title, value, subtitle, color, icon, gradient }) => (
    <div
      className={`bg-gradient-to-r ${gradient} text-white p-6 rounded-lg shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-${color}-100`}>{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          <p className={`text-${color}-200 text-sm mt-1`}>{subtitle}</p>
        </div>
        <div className="text-white opacity-80">
          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d={icon} clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  ),
);

const ErrorAlert = React.memo(({ error, onRetry }) => (
  <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <svg
          className="w-5 h-5 text-yellow-400 mr-3"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="text-yellow-700 font-medium">Connection Issue</p>
          <p className="text-yellow-600 text-sm">{error}</p>
        </div>
      </div>
      <button
        onClick={onRetry}
        className="bg-yellow-600 text-white px-4 py-2 rounded text-sm hover:bg-yellow-700 transition-colors"
      >
        Retry
      </button>
    </div>
  </div>
));

const QuickActionCard = React.memo(({ action }) => (
  <Link
    to={action.to}
    className={`group bg-white border-2 border-${action.color}-200 hover:border-${action.color}-400 p-6 rounded-lg shadow hover:shadow-lg transition-all duration-200 text-center focus:outline-none focus:ring-2 focus:ring-${action.color}-500`}
  >
    <div className="mb-3 group-hover:scale-110 transition-transform flex justify-center">
      <svg
        className={`w-10 h-10 text-${action.color}-600`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d={action.icon} />
      </svg>
    </div>
    <div className="font-semibold text-gray-800 mb-2">{action.title}</div>
    <div className="text-sm text-gray-600">{action.description}</div>
  </Link>
));

const EmptyState = React.memo(({ icon, title, subtitle }) => (
  <div className="text-center py-8 text-gray-500">
    <div className="flex justify-center mb-2">
      <svg
        className="w-12 h-12 text-gray-400"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path fillRule="evenodd" d={icon} clipRule="evenodd" />
      </svg>
    </div>
    <p>{title}</p>
    <p className="text-sm">{subtitle}</p>
  </div>
));

// Main component
const AdminDashboard = () => {
  const [summary, setSummary] = useState(INITIAL_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const { user, loading: authLoading } = useAuth();

  const API_BASE = useMemo(
    () => import.meta.env.VITE_API_BASE || "http://localhost:3001",
    [],
  );

  const fetchSummary = useCallback(
    async (attempt = 0) => {
      // Don't fetch if user is not authenticated or not admin
      if (!user || !user.isAdmin) {
        console.log(
          "[AdminDashboard] User not authenticated or not admin, skipping fetch",
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log("[AdminDashboard] Fetching analytics summary", {
          API_BASE,
          user: { email: user.email, isAdmin: user.isAdmin },
          attempt,
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

        // Get JWT from localStorage
        const token = localStorage.getItem("auth_token");

        const response = await fetch(
          `${API_BASE}/api/admin/analytics/summary`,
          {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(
            `API responded with status ${response.status}: ${response.statusText}`,
          );
        }

        const data = await response.json();
        console.log("Successfully received analytics data:", data);

        setSummary(transformApiData(data));
        setRetryCount(0);
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setError(getErrorMessage(err));

        // Auto-retry logic
        if (attempt < MAX_RETRY_ATTEMPTS && err.name !== "AbortError") {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            fetchSummary(attempt + 1);
          }, RETRY_DELAYS[attempt]);
        }
      } finally {
        setLoading(false);
      }
    },
    [API_BASE, user],
  );

  // Single effect to handle data fetching
  useEffect(() => {
    console.log("[AdminDashboard] Auth state or user changed", {
      authLoading,
      user: user ? { email: user.email, isAdmin: user.isAdmin } : null,
    });

    // Only fetch if auth is complete and user is admin
    if (!authLoading) {
      if (user && user.isAdmin) {
        console.log("[AdminDashboard] Fetching summary data");
        fetchSummary();
      } else {
        console.log("[AdminDashboard] User not admin or not authenticated");
        setLoading(false);
      }
    }
  }, [authLoading, user, fetchSummary]);

  const handleRetry = useCallback(() => {
    setRetryCount(0);
    fetchSummary();
  }, [fetchSummary]);

  // Memoized metric cards data
  const metricCards = useMemo(
    () => [
      {
        title: "Total Revenue",
        value: formatCurrency(summary.totalRevenue),
        subtitle: `+${formatPercentage(summary.revenueGrowth)} from last month`,
        color: "blue",
        gradient: "from-blue-500 to-blue-600",
        icon: "M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z",
      },
      {
        title: "Total Orders",
        value: summary.totalOrders || 0,
        subtitle: `+${formatPercentage(summary.orderGrowth)} from last month`,
        color: "green",
        gradient: "from-green-500 to-green-600",
        icon: "M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3z",
      },
      {
        title: "Avg Order Value",
        value: formatCurrency(summary.averageOrderValue),
        subtitle: `${summary.todayOrders} orders today`,
        color: "purple",
        gradient: "from-purple-500 to-purple-600",
        icon: "M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z",
      },
      {
        title: "Total Customers",
        value: summary.totalCustomers || 0,
        subtitle: `${summary.recentCustomers} new this week`,
        color: "indigo",
        gradient: "from-indigo-500 to-indigo-600",
        icon: "M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z",
      },
    ],
    [summary],
  );

  const additionalMetrics = useMemo(
    () => [
      {
        label: "Monthly Revenue",
        value: formatCurrency(summary.monthlyRevenue),
        color: "gray",
      },
      {
        label: "Pending Orders",
        value: summary.pendingOrders,
        color: "orange",
      },
      {
        label: "Active Products",
        value: summary.activeProducts,
        color: "green",
      },
      {
        label: "Low Stock Alert",
        value: summary.lowStockProducts,
        color: "red",
      },
    ],
    [summary],
  );

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <>
        <AdminNav />
        <div
          className="min-h-screen bg-gray-100"
          style={{ paddingTop: "64px" }}
        >
          <div className="max-w-8xl mt-10 p-8 bg-white rounded shadow-md">
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-600">Authenticating...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show unauthorized message if user is not admin
  if (user && !user.isAdmin) {
    return (
      <>
        <AdminNav />
        <div
          className="min-h-screen bg-gray-100"
          style={{ paddingTop: "64px" }}
        >
          <div className="max-w-8xl mt-10 p-8 bg-white rounded shadow-md">
            <div className="text-center py-12">
              <div className="text-red-600 text-xl font-semibold mb-2">
                Access Denied
              </div>
              <div className="text-gray-600">
                You need admin privileges to access this dashboard.
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-gray-100" style={{ paddingTop: "64px" }}>
        <div className="max-w-8xl mt-10 p-8 bg-white rounded shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-blue-700">
                Admin Dashboard
              </h2>
              <p className="text-gray-600 mt-1">
                Monitor your store's performance and growth
              </p>
            </div>
            {retryCount > 0 && (
              <div className="flex items-center text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm">
                  Reconnecting... (Attempt {retryCount})
                </span>
              </div>
            )}
          </div>

          {error && <ErrorAlert error={error} onRetry={handleRetry} />}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-600">Loading dashboard data...</span>
            </div>
          )}

          {/* Dashboard Content */}
          {!loading && (
            <>
              {/* Main Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {metricCards.map((card, index) => (
                  <MetricCard key={index} {...card} />
                ))}
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {additionalMetrics.map((metric, index) => (
                  <div
                    key={index}
                    className="bg-white border-2 border-gray-200 p-4 rounded-lg text-center"
                  >
                    <p className="text-gray-600 text-sm">{metric.label}</p>
                    <p
                      className={`text-2xl font-bold text-${metric.color}-600`}
                    >
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-6 text-gray-800">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {QUICK_ACTIONS.map((action, index) => (
                    <QuickActionCard key={index} action={action} />
                  ))}
                </div>
              </div>

              {/* Data Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Products */}
                <div className="bg-white border rounded-lg p-6 shadow">
                  <h3 className="text-xl font-bold mb-4 text-blue-600 flex items-center">
                    <svg
                      className="w-6 h-6 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Top Selling Products
                  </h3>
                  {summary.topProducts?.length > 0 ? (
                    <div className="space-y-3">
                      {summary.topProducts.slice(0, 5).map((product, index) => (
                        <div
                          key={product.id || index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded border-l-4 border-blue-400"
                        >
                          <div className="flex items-center flex-1">
                            <span className="text-lg font-bold text-blue-600 mr-3">
                              #{index + 1}
                            </span>
                            <div className="flex-1">
                              <span className="font-medium block">
                                {product.title}
                              </span>
                              <span className="text-sm text-gray-500">
                                Stock: {product.stockLevel || "N/A"}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                              {product.quantity} sold
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {formatCurrency(product.revenue)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      title="No sales data available yet"
                      subtitle="Products will appear here once orders are placed"
                    />
                  )}
                </div>

                {/* Order Status Distribution */}
                <div className="bg-white border rounded-lg p-6 shadow">
                  <h3 className="text-xl font-bold mb-4 text-green-600 flex items-center">
                    <svg
                      className="w-6 h-6 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    Order Status Overview
                  </h3>
                  {summary.orderStatus?.length > 0 ? (
                    <div className="space-y-3">
                      {summary.orderStatus.map((status, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded border-l-4 ${getStatusColor(status.status)}`}
                        >
                          <div className="flex items-center">
                            <span className="font-medium capitalize">
                              {status.status}
                            </span>
                            <span className="text-sm text-gray-600 ml-2">
                              ({status.percentage}%)
                            </span>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(status.status)}`}
                          >
                            {status.count} orders
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z"
                      title="No order data available"
                      subtitle="Order statistics will appear here"
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
