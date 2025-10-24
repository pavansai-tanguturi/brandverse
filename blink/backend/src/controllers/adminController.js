import dayjs from "dayjs";
import { supabaseAdmin } from "../config/supabaseClient.js";

export async function summary(req, res) {
  try {
    const startDate =
      req.query.startDate || dayjs().subtract(30, "day").format("YYYY-MM-DD");
    const endDate = req.query.endDate || dayjs().format("YYYY-MM-DD");

    // Get orders data
    const { data: orders, error: oErr } = await supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        order_items(*),
        customers(full_name, email)
      `,
      )
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (oErr) return res.status(400).json({ error: oErr.message });

    // Get total customers
    const { data: customers, error: cErr } = await supabaseAdmin
      .from("customers")
      .select("id");
    if (cErr) return res.status(400).json({ error: cErr.message });

    // Get total products
    const { data: products, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id, title, category_id")
      .eq("is_active", true);
    if (pErr) return res.status(400).json({ error: pErr.message });

    // Calculate summary metrics - only count completed/paid/delivered orders for revenue
    const paidOrders = (orders || []).filter(order => 
      ["completed", "confirmed", "paid", "delivered"].includes(order.status)
    );
    const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.total_cents || 0), 0) / 100;
    const totalOrders = orders?.length || 0;
    const totalCustomers = customers?.length || 0;
    const totalProducts = products?.length || 0;
    const averageOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

    // Generate daily revenue data - only from paid orders
    const dailyRevenue = [];
    const revenueByDate = new Map();

    paidOrders.forEach((order) => {
      const date = dayjs(order.created_at).format("YYYY-MM-DD");
      const current = revenueByDate.get(date) || 0;
      revenueByDate.set(date, current + (order.total_cents || 0) / 100);
    });

    // Fill in missing dates with 0 revenue
    let currentDate = dayjs(startDate);
    const endDateObj = dayjs(endDate);

    while (currentDate.isBefore(endDateObj) || currentDate.isSame(endDateObj)) {
      const dateStr = currentDate.format("YYYY-MM-DD");
      dailyRevenue.push({
        date: dateStr,
        revenue: revenueByDate.get(dateStr) || 0,
      });
      currentDate = currentDate.add(1, "day");
    }

    // Calculate category revenue - only from paid orders
    const categoryRevenue = [];
    const categoryMap = new Map();

    paidOrders.forEach((order) => {
      (order.order_items || []).forEach((item) => {
        const product = products?.find((p) => p.id === item.product_id);
        const categoryName = product?.category_id || "Uncategorized";
        const current = categoryMap.get(categoryName) || 0;
        categoryMap.set(categoryName, current + (item.total_cents || 0) / 100);
      });
    });

    categoryMap.forEach((revenue, category) => {
      categoryRevenue.push({ category, revenue });
    });

    // Calculate top products - only from paid orders
    const productMap = new Map();
    paidOrders.forEach((order) => {
      (order.order_items || []).forEach((item) => {
        const key = item.product_id;
        const current = productMap.get(key) || {
          title: item.title,
          quantity: 0,
          revenue: 0,
        };
        current.quantity += item.quantity || 0;
        current.revenue += (item.total_cents || 0) / 100;
        productMap.set(key, current);
      });
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Calculate order status distribution
    const statusMap = new Map();
    (orders || []).forEach((order) => {
      const status = order.status || "pending";
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    const orderStatus = Array.from(statusMap.entries()).map(
      ([status, count]) => ({
        status,
        count,
      }),
    );

    const response = {
      summary: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        averageOrderValue,
        revenueGrowth: 0, // Could calculate this with historical data
      },
      dailyRevenue,
      categoryRevenue,
      topProducts,
      orderStatus,
    };

    res.json(response);
  } catch (e) {
    console.error("Analytics error:", e);
    res.status(500).json({ error: e.message });
  }
}

export async function exportAnalytics(req, res) {
  try {
    const format = req.query.format || "json";
    const startDate =
      req.query.startDate || dayjs().subtract(30, "day").format("YYYY-MM-DD");
    const endDate = req.query.endDate || dayjs().format("YYYY-MM-DD");

    // Get the same data as summary endpoint
    const { data: orders, error: oErr } = await supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        order_items(*),
        customers(full_name, email)
      `,
      )
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (oErr) return res.status(400).json({ error: oErr.message });

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=analytics-${startDate}-to-${endDate}.json`,
      );
      res.json({
        exportDate: new Date().toISOString(),
        period: { startDate, endDate },
        orders: orders || [],
        summary: {
          totalOrders: orders?.length || 0,
          totalRevenue:
            (orders || []).reduce(
              (sum, order) => sum + (order.total_cents || 0),
              0,
            ) / 100,
          period: `${startDate} to ${endDate}`,
        },
      });
    } else if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=analytics-${startDate}-to-${endDate}.csv`,
      );

      const csvHeader =
        "Order ID,Customer Name,Customer Email,Total,Status,Date,Items\n";
      const csvRows = (orders || [])
        .map((order) => {
          const customerName = order.customers?.full_name || "Unknown";
          const customerEmail = order.customers?.email || "Unknown";
          const total = (order.total_cents || 0) / 100;
          const items = (order.order_items || [])
            .map((item) => `${item.title}(${item.quantity})`)
            .join(";");
          const date = dayjs(order.created_at).format("YYYY-MM-DD");

          return `"${order.id}","${customerName}","${customerEmail}",${total},"${order.status}","${date}","${items}"`;
        })
        .join("\n");

      res.send(csvHeader + csvRows);
    } else {
      res.status(400).json({ error: "Invalid format. Use json or csv" });
    }
  } catch (e) {
    console.error("Export error:", e);
    res.status(500).json({ error: e.message });
  }
}
