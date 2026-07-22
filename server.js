const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 简易API - 直接用JSON文件存储
const DB_FILE = path.join(__dirname, 'data.json');

function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  }
  return { products: [], orders: [], settings: {}, payment_qr: [] };
}

function saveDB(db) {
  const dir = path.join(__dirname, '.');
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// API路由
app.get('/api/products', (req, res) => {
  const db = loadDB();
  res.json(db.products.filter(p => p.status === 'active'));
});

app.get('/api/admin/products', (req, res) => {
  const db = loadDB();
  res.json(db.products);
});

app.post('/api/admin/products', (req, res) => {
  const db = loadDB();
  const product = { ...req.body, id: db.products.length + 1, status: 'active' };
  db.products.push(product);
  saveDB(db);
  res.json(product);
});

app.put('/api/admin/products/:id', (req, res) => {
  const db = loadDB();
  const idx = db.products.findIndex(p => p.id == req.params.id);
  if (idx >= 0) {
    db.products[idx] = { ...db.products[idx], ...req.body };
    saveDB(db);
    res.json(db.products[idx]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.delete('/api/admin/products/:id', (req, res) => {
  const db = loadDB();
  db.products = db.products.filter(p => p.id != req.params.id);
  saveDB(db);
  res.json({ ok: true });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});