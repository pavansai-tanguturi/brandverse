import dayjs from 'dayjs';
import { supabaseAdmin } from '../config/supabaseClient.js';

export async function summary(req, res) {
  try {
    const from = req.query.from || dayjs().subtract(30, 'day').toISOString();
    const to = req.query.to || new Date().toISOString();

    const { data: orders, error: oErr } = await supabaseAdmin
      .from('orders')
      .select('total_cents, created_at')
      .gte('created_at', from)
      .lte('created_at', to)
      .eq('status', 'paid');
    if (oErr) return res.status(400).json({ error: oErr.message });

    const total_sales = (orders || []).reduce((s, o) => s + o.total_cents, 0);
    const order_count = orders?.length || 0;
    const avg_order_value = order_count ? Math.round(total_sales / order_count) : 0;

    const { data: topItems } = await supabaseAdmin
      .from('order_items')
      .select('product_id, title, quantity')
      .gte('created_at', from)
      .lte('created_at', to);

    const topMap = new Map();
    for (const it of topItems || []) {
      const k = it.product_id;
      const v = topMap.get(k) || { product_id: k, title: it.title, qty: 0 };
      v.qty += it.quantity;
      topMap.set(k, v);
    }
    const top_products = Array.from(topMap.values()).sort((a, b) => b.qty - a.qty).slice(0, 10);

    const { data: lowStock } = await supabaseAdmin
      .from('products')
      .select('id, title, stock_quantity')
      .lte('stock_quantity', 5)
      .order('stock_quantity');

    res.json({ from, to, total_sales, order_count, avg_order_value, top_products, low_stock: lowStock || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
}