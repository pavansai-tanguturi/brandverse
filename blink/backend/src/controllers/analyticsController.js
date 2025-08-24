import { supabaseAdmin } from '../config/supabaseClient.js';

export async function getDashboardAnalytics(req, res) {
  if (!req.session?.user || req.session.user.id !== process.env.ADMIN_ID)
    return res.status(403).json({ error: 'Admin only' });

  try {
    const { startDate, endDate } = req.query;
    
    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Daily revenue query
    const { data: dailyRevenue, error: revenueError } = await supabaseAdmin
      .from('orders')
      .select('created_at, total_cents')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: true });

    if (revenueError) throw revenueError;

    // Product sales by category
    const { data: categorySales, error: categoryError } = await supabaseAdmin
      .from('order_items')
      .select(`
        quantity,
        unit_price_cents,
        products!inner(
          categories!inner(name)
        ),
        orders!inner(
          created_at,
          status
        )
      `)
      .gte('orders.created_at', start.toISOString())
      .lte('orders.created_at', end.toISOString())
      .eq('orders.status', 'completed');

    if (categoryError) throw categoryError;

    // Top selling products
    const { data: topProducts, error: topProductsError } = await supabaseAdmin
      .from('order_items')
      .select(`
        quantity,
        unit_price_cents,
        products!inner(id, title),
        orders!inner(status, created_at)
      `)
      .gte('orders.created_at', start.toISOString())
      .lte('orders.created_at', end.toISOString())
      .eq('orders.status', 'completed');

    if (topProductsError) throw topProductsError;

    // Order status distribution
    const { data: orderStatus, error: statusError } = await supabaseAdmin
      .from('orders')
      .select('status, total_cents')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (statusError) throw statusError;

    // Total customers
    const { count: totalCustomers, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (customerError) throw customerError;

    // Total products
    const { count: totalProducts, error: productCountError } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (productCountError) throw productCountError;

    // Process daily revenue data
    const dailyRevenueMap = {};
    dailyRevenue.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      dailyRevenueMap[date] = (dailyRevenueMap[date] || 0) + (order.total_cents || 0) / 100;
    });

    // Process category sales
    const categoryRevenueMap = {};
    categorySales.forEach(item => {
      const categoryName = item.products?.categories?.name || 'Uncategorized';
      const revenue = (item.quantity || 0) * (item.unit_price_cents || 0) / 100;
      categoryRevenueMap[categoryName] = (categoryRevenueMap[categoryName] || 0) + revenue;
    });

    // Process top products
    const productSalesMap = {};
    topProducts.forEach(item => {
      const productId = item.products?.id;
      const productTitle = item.products?.title || 'Unknown Product';
      if (productId) {
        if (!productSalesMap[productId]) {
          productSalesMap[productId] = {
            title: productTitle,
            quantity: 0,
            revenue: 0
          };
        }
        productSalesMap[productId].quantity += item.quantity || 0;
        productSalesMap[productId].revenue += (item.quantity || 0) * (item.unit_price_cents || 0) / 100;
      }
    });

    // Process order status
    const statusMap = {};
    let totalRevenue = 0;
    orderStatus.forEach(order => {
      statusMap[order.status] = (statusMap[order.status] || 0) + 1;
      if (order.status === 'completed') {
        totalRevenue += (order.total_cents || 0) / 100;
      }
    });

    // Calculate growth (simple comparison with previous period)
    const periodDays = Math.ceil((end - start) / (24 * 60 * 60 * 1000));
    const prevStart = new Date(start.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const prevEnd = start;

    const { data: prevRevenue } = await supabaseAdmin
      .from('orders')
      .select('total_cents')
      .gte('created_at', prevStart.toISOString())
      .lte('created_at', prevEnd.toISOString())
      .eq('status', 'completed');

    const prevTotalRevenue = prevRevenue?.reduce((sum, order) => sum + (order.total_cents || 0) / 100, 0) || 0;
    const revenueGrowth = prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue * 100) : 0;

    res.json({
      summary: {
        totalRevenue: totalRevenue,
        totalOrders: orderStatus.length,
        totalCustomers: totalCustomers || 0,
        totalProducts: totalProducts || 0,
        revenueGrowth: revenueGrowth,
        averageOrderValue: orderStatus.length > 0 ? totalRevenue / orderStatus.length : 0
      },
      dailyRevenue: Object.entries(dailyRevenueMap).map(([date, revenue]) => ({
        date,
        revenue
      })).sort((a, b) => a.date.localeCompare(b.date)),
      categoryRevenue: Object.entries(categoryRevenueMap).map(([category, revenue]) => ({
        category,
        revenue
      })).sort((a, b) => b.revenue - a.revenue),
      topProducts: Object.values(productSalesMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
      orderStatus: Object.entries(statusMap).map(([status, count]) => ({
        status,
        count
      })),
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function exportAnalytics(req, res) {
  if (!req.session?.user || req.session.user.id !== process.env.ADMIN_ID)
    return res.status(403).json({ error: 'Admin only' });

  try {
    const { format = 'json', startDate, endDate } = req.query;
    
    // Get analytics data
    req.query = { startDate, endDate };
    const analyticsRes = await getDashboardAnalytics(req, { 
      json: (data) => data,
      status: () => ({ json: (data) => data })
    });

    const data = analyticsRes;

    if (format === 'csv') {
      // Convert to CSV
      const csvLines = [];
      csvLines.push('Date,Revenue');
      data.dailyRevenue.forEach(item => {
        csvLines.push(`${item.date},${item.revenue}`);
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="analytics-export.csv"');
      res.send(csvLines.join('\n'));
    } else {
      // Default JSON export
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="analytics-export.json"');
      res.json(data);
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
}
