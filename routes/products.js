const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/products - 获取所有上架商品（可按 category 过滤）
router.get('/', function(req, res) {
  const category = req.query.category;
  let sql = 'SELECT * FROM products WHERE status = ? ORDER BY created_at DESC';
  if (category) {
    sql = 'SELECT * FROM products WHERE category = ? AND status = ? ORDER BY created_at DESC';
    const stmt = db.prepare(sql);
    const products = stmt.all(category, 'active');
    return res.json(products);
  }
  const stmt = db.prepare(sql);
  const products = stmt.all('active');
  res.json(products);
});

// GET /api/admin/products - 后台获取所有商品（含下架）
router.get('/admin/products', function(req, res) {
  const stmt = db.prepare('SELECT * FROM products ORDER BY id DESC');
  const products = stmt.all();
  res.json(products);
});

// POST /api/admin/products - 创建商品
router.post('/admin/products', function(req, res) {
  const { name, category, price, spec, tags, description, status } = req.body;
  if (!name || !category || price == null) {
    return res.status(400).json({ error: '缺少必要字段' });
  }
  const tagsArr = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []);
  const stmt = db.prepare(
    'INSERT INTO products (name, category, price, spec, tags, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const info = stmt.run(name, category, price, spec || '', JSON.stringify(tagsArr), description || '', status || 'active');
  
  // SSE 通知
  require('../sse').broadcast({ type: 'product_created', payload: { id: info.lastInsertRowid } });
  
  res.json({ id: info.lastInsertRowid, name });
});

// PUT /api/admin/products/:id - 更新商品
router.put('/admin/products/:id', function(req, res) {
  const id = req.params.id;
  const { name, category, price, spec, tags, description, status } = req.body;
  const tagsArr = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []);
  
  const stmt = db.prepare(
    'UPDATE products SET name=?, category=?, price=?, spec=?, tags=?, description=?, status=?, updated_at=datetime(\'now\') WHERE id=?'
  );
  stmt.run(name, category, price, spec || '', JSON.stringify(tagsArr), description || '', status || 'active', id);
  
  require('../sse').broadcast({ type: 'product_updated', payload: { id } });
  res.json({ ok: true });
});

// PATCH /api/admin/products/:id/toggle - 切换上下架
router.patch('/admin/products/:id/toggle', function(req, res) {
  const id = req.params.id;
  const stmt = db.prepare('SELECT status FROM products WHERE id = ?');
  const product = stmt.get(id);
  if (!product) return res.status(404).json({ error: '商品不存在' });
  
  const newStatus = product.status === 'active' ? 'inactive' : 'active';
  db.prepare('UPDATE products SET status=?, updated_at=datetime(\'now\') WHERE id=?').run(newStatus, id);
  
  require('../sse').broadcast({ type: 'product_toggled', payload: { id, status: newStatus } });
  res.json({ ok: true, status: newStatus });
});

// DELETE /api/admin/products/:id - 删除商品
router.delete('/admin/products/:id', function(req, res) {
  const id = req.params.id;
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  require('../sse').broadcast({ type: 'product_deleted', payload: { id } });
  res.json({ ok: true });
});

module.exports = router;
