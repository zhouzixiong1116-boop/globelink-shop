const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/settings - 获取站点设置
router.get('/settings', function(req, res) {
  const stmt = db.prepare('SELECT key, value FROM settings');
  const rows = stmt.all();
  const settings = {};
  rows.forEach(function(r) { settings[r.key] = r.value; });
  res.json(settings);
});

// PUT /api/settings - 更新站点设置
router.put('/settings', function(req, res) {
  const settings = req.body;
  const insert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  for (const key in settings) {
    insert.run(key, String(settings[key]));
  }
  require('../sse').broadcast({ type: 'settings_updated', payload: settings });
  res.json({ ok: true });
});

module.exports = router;
