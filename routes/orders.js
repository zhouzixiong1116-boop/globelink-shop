const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('crypto');

// 生成唯一订单号
function generateOrderId() {
  return 'GL' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

// POST /api/orders - 前台提交订单
router.post('/orders', function(req, res) {
  const { productId, productName, price, category, customerName, contact, payment, note } = req.body;
  if (!productName || !customerName || !contact || !price) {
    return res.status(400).json({ error: '缺少必要字段' });
  }
  
  const orderId = generateOrderId();
  const stmt = db.prepare(
    'INSERT INTO orders (id, product_id, product_name, category, price, customer_name, contact, payment, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const info = stmt.run(orderId, productId || null, productName, category || '', price, customerName, contact, payment || 'wechat', note || '');
  
  // SSE 通知有新订单
  require('../sse').broadcast({ type: 'new_order', payload: { id: orderId } });
  
  res.json({ id: orderId, product_name: productName, price, payment });
});

// GET /api/admin/orders - 后台获取所有订单
router.get('/admin/orders', function(req, res) {
  const stmt = db.prepare('SELECT * FROM orders ORDER BY created_at DESC');
  const orders = stmt.all();
  res.json(orders);
});

// PATCH /api/admin/orders/:id/status - 更新订单状态
router.patch('/admin/orders/:id/status', function(req, res) {
  const id = req.params.id;
  const { status } = req.body;
  if (!['pending', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: '无效的状态值' });
  }
  db.prepare("UPDATE orders SET status=?, updated_at=datetime('now') WHERE id=?").run(status, id);
  require('../sse').broadcast({ type: 'order_status_changed', payload: { id, status } });
  res.json({ ok: true, status });
});

module.exports = router;
