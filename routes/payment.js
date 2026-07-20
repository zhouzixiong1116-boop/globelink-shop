const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/payment/qr?method=wechat - 获取指定支付方式收款码（优先匹配带 query 的）
router.get('/payment/qr', function(req, res) {
  const method = req.query.method;
  if (method) {
    const stmt = db.prepare('SELECT * FROM payment_qr WHERE method = ?');
    const qr = stmt.get(method);
    if (!qr) return res.status(404).json({ error: '未找到收款码' });
    return res.json(qr);
  }
  
  // 无 query 参数时返回全部
  const stmt = db.prepare('SELECT * FROM payment_qr ORDER BY method');
  const qrs = stmt.all();
  res.json(qrs);
});

// POST /api/payment/qr - 上传/创建收款码
router.post('/payment/qr', function(req, res) {
  const { method, note, image_data } = req.body;
  if (!method) return res.status(400).json({ error: '缺少支付方式' });
  
  let qrUrl = null;
  if (image_data) {
    const fs = require('fs');
    const path = require('path');
    const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    
    const base64Data = image_data.replace(/^data:image\/\w+;base64,/, '');
    const extMatch = image_data.match(/^data:image\/(\w+)/);
    const ext = extMatch ? extMatch[1] : 'png';
    const fileName = 'qr_' + method + '_' + Date.now() + '.' + ext;
    const filePath = path.join(UPLOAD_DIR, fileName);
    fs.writeFileSync(filePath, base64Data, 'base64');
    qrUrl = '/uploads/' + fileName;
  }
  
  const stmt = db.prepare(
    'INSERT INTO payment_qr (method, qr_url, note) VALUES (?, ?, ?)'
  );
  const info = stmt.run(method, qrUrl, note || '');
  res.json({ id: info.lastInsertRowid, ok: true });
});

// PUT /api/payment/qr/:id - 更新收款码
router.put('/payment/qr/:id', function(req, res) {
  const id = req.params.id;
  const { method, note, image_data } = req.body;
  
  let qrUrl = null;
  if (image_data) {
    const fs = require('fs');
    const path = require('path');
    const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    
    const base64Data = image_data.replace(/^data:image\/\w+;base64,/, '');
    const extMatch = image_data.match(/^data:image\/(\w+)/);
    const ext = extMatch ? extMatch[1] : 'png';
    const fileName = 'qr_' + method + '_' + Date.now() + '.' + ext;
    const filePath = path.join(UPLOAD_DIR, fileName);
    fs.writeFileSync(filePath, base64Data, 'base64');
    qrUrl = '/uploads/' + fileName;
  }
  
  if (qrUrl) {
    db.prepare('UPDATE payment_qr SET method=?, qr_url=?, note=?, updated_at=datetime(\'now\') WHERE id=?').run(method, qrUrl, note || '', id);
  } else {
    db.prepare('UPDATE payment_qr SET method=?, note=?, updated_at=datetime(\'now\') WHERE id=?').run(method, note || '', id);
  }
  res.json({ ok: true });
});

// DELETE /api/payment/qr/:id - 删除收款码
router.delete('/payment/qr/:id', function(req, res) {
  const id = req.params.id;
  db.prepare('DELETE FROM payment_qr WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;
