const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 数据目录：生产环境用环境变量，本地用当前目录
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'shop.db'));

// 性能优化
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============================================
//  初始化表结构
// ============================================

db.exec(`
  -- 商品表
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'vpn',
    price REAL NOT NULL,
    spec TEXT DEFAULT '',
    tags TEXT DEFAULT '[]',
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- 订单表
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    category TEXT DEFAULT '',
    price REAL NOT NULL,
    customer_name TEXT NOT NULL,
    contact TEXT NOT NULL,
    payment TEXT DEFAULT 'wechat',
    note TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- 站点设置表
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  );

  -- 收款码表
  CREATE TABLE IF NOT EXISTS payment_qr (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    method TEXT NOT NULL DEFAULT 'wechat',
    qr_url TEXT,
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- 初始化默认设置
  INSERT OR IGNORE INTO settings (key, value) VALUES
    ('shop_name', 'Globelink商行'),
    ('wechat', 'globelink_support'),
    ('qq', '123456789'),
    ('usdt', ''),
    ('banner_title', '全球网络加速 · 一站式数字服务'),
    ('banner_sub', 'VPN加速 | 账号服务 | 会员充值 | 虚拟号码接码'),
    ('footer_text', '© 2026 Globelink商行 All Rights Reserved.');

  -- 初始化默认收款码（空）
  INSERT OR IGNORE INTO payment_qr (method) VALUES
    ('wechat'),
    ('alipay'),
    ('usdt');

  -- 为订单 id 创建索引
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
  CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
`);

module.exports = db;
