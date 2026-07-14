const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");

// ============================================================
//  SSE 实时推送 — 广播客户端连接
// ============================================================
const clients = [];

app.get("/api/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    const idx = clients.indexOf(res);
    if (idx > -1) clients.splice(idx, 1);
  });

  clients.push(res);
});

function broadcast(type, payload) {
  const data = `data: ${JSON.stringify({ type, payload, ts: Date.now() })}\n\n`;
  for (const client of clients) {
    try { client.write(data); } catch (_) {}
  }
}

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON(file, fallback) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf-8"));
    }
  } catch (e) {}
  return fallback;
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

function initData() {
  const productsFile = path.join(DATA_DIR, "products.json");
  const ordersFile = path.join(DATA_DIR, "orders.json");
  const settingsFile = path.join(DATA_DIR, "settings.json");

  if (!fs.existsSync(productsFile)) {
    const defaults = [
      { id: 1, name: "手机加速器", category: "vpn", price: 15, spec: "月付 15元/月", tags: ["教程","手机"], description: "手机端全球网络加速，稳定高速，附详细使用教程。", status: "active" },
      { id: 2, name: "电脑不限速", category: "vpn", price: 88, spec: "月付 88元/1000G", tags: ["教程","电脑","不限速"], description: "电脑端不限时高速加速，月流量1000G，适合重度用户。", status: "active" },
      { id: 3, name: "季度VIP套餐", category: "vpn", price: 198, spec: "手机+电脑 季度", tags: ["教程","套餐","优惠"], description: "手机+电脑双端加速，季度套餐更划算。", status: "active" },
      { id: 4, name: "年度VIP", category: "vpn", price: 698, spec: "全端不限速 年度", tags: ["教程","年度","超值"], description: "全年全端不限速，平均每月不到60元。", status: "active" },
      { id: 5, name: "美区Apple ID（临时）", category: "apple", price: 5, spec: "单次使用", tags: ["教程","临时"], description: "临时体验号，适合偶尔下载APP的用户。", status: "active" },
      { id: 6, name: "美区Apple ID（永久）", category: "apple", price: 58, spec: "独享绑定", tags: ["教程","永久","独享"], description: "永久独享账号，支持绑定个人信息，安全可靠。", status: "active" },
      { id: 7, name: "Apple家庭组", category: "apple", price: 268, spec: "6人团 年度", tags: ["教程","家庭组"], description: "加入我们的Apple家庭组，共享付费应用和资源。", status: "active" },
      { id: 8, name: "GPT Plus 会员", category: "charge", price: 35, spec: "月付", tags: ["代充","秒到"], description: "ChatGPT Plus月卡代充，官方账号，安全可靠。", status: "active" },
      { id: 9, name: "Claude Pro", category: "charge", price: 40, spec: "月付", tags: ["代充","秒到"], description: "Anthropic Claude Pro月度会员代充。", status: "active" },
      { id: 10, name: "Midjourney", category: "charge", price: 30, spec: "月付", tags: ["代充","AI绘画"], description: "MJ月度会员代充，支持各种AI绘画需求。", status: "active" },
      { id: 11, name: "远程配置服务", category: "extra", price: 8, spec: "一对一指导", tags: ["远程","教程"], description: "一对一远程协助，帮您配置各种软件和服务。", status: "active" },
      { id: 12, name: "其他国外软件代充", category: "charge", price: 20, spec: "按需报价", tags: ["代充","咨询"], description: "除以上列出的软件外，其他国外软件也可代充，请联系客服询价。", status: "active" },
    ];
    writeJSON(productsFile, defaults);
  }

  if (!fs.existsSync(ordersFile)) {
    writeJSON(ordersFile, []);
  }

  if (!fs.existsSync(settingsFile)) {
    writeJSON(settingsFile, {
      shop_name: "Globelink商行",
      wechat: "globelink_support",
      qq: "123456789",
      usdt: "",
      banner_title: "全球网络加速 · 一站式数字服务",
      banner_sub: "VPN加速 | 美区Apple ID | 国外软件代充 | 远程配置指导",
      footer_text: "© 2026 Globelink商行 All Rights Reserved.",
    });
  }
}

initData();

// ============================================================
//  商品 API
// ============================================================

app.get("/api/products", (req, res) => {
  const products = readJSON(path.join(DATA_DIR, "products.json"), []);
  const category = req.query.category;
  let filtered = products.filter(p => p.status === "active");
  if (category && category !== "all") {
    filtered = filtered.filter(p => p.category === category);
  }
  res.json(filtered);
});

app.get("/api/admin/products", (req, res) => {
  const products = readJSON(path.join(DATA_DIR, "products.json"), []);
  res.json(products);
});

app.post("/api/admin/products", (req, res) => {
  const products = readJSON(path.join(DATA_DIR, "products.json"), []);
  const { name, category, price, spec, tags, description, status } = req.body;
  if (!name || !category || price === undefined) {
    return res.status(400).json({ error: "缺少必要字段" });
  }
  const maxId = products.reduce((max, p) => Math.max(max, p.id), 0);
  const product = {
    id: maxId + 1,
    name, category, price,
    spec: spec || "",
    tags: tags || [],
    description: description || "",
    status: status || "active"
  };
  products.push(product);
  writeJSON(path.join(DATA_DIR, "products.json"), products);
  broadcast("product_created", product);
  res.json(product);
});

app.put("/api/admin/products/:id", (req, res) => {
  const products = readJSON(path.join(DATA_DIR, "products.json"), []);
  const id = parseInt(req.params.id);
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: "商品不存在" });

  const { name, category, price, spec, tags, description, status } = req.body;
  products[idx] = { ...products[idx], name, category, price, spec: spec || "", tags: tags || [], description: description || "", status: status || "active" };
  writeJSON(path.join(DATA_DIR, "products.json"), products);
  broadcast("product_updated", products[idx]);
  res.json(products[idx]);
});

app.delete("/api/admin/products/:id", (req, res) => {
  const products = readJSON(path.join(DATA_DIR, "products.json"), []);
  const id = parseInt(req.params.id);
  const filtered = products.filter(p => p.id !== id);
  writeJSON(path.join(DATA_DIR, "products.json"), filtered);
  broadcast("product_deleted", { id });
  res.json({ success: true });
});

app.patch("/api/admin/products/:id/toggle", (req, res) => {
  const products = readJSON(path.join(DATA_DIR, "products.json"), []);
  const id = parseInt(req.params.id);
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: "商品不存在" });
  products[idx].status = products[idx].status === "active" ? "inactive" : "active";
  writeJSON(path.join(DATA_DIR, "products.json"), products);
  broadcast("product_toggled", products[idx]);
  res.json(products[idx]);
});

// ============================================================
//  订单 API
// ============================================================

app.post("/api/orders", (req, res) => {
  const orders = readJSON(path.join(DATA_DIR, "orders.json"), []);
  const { productId, productName, price, customerName, contact, payment, note } = req.body;
  if (!customerName || !contact || !payment) {
    return res.status(400).json({ error: "缺少必要字段" });
  }
  const order = {
    id: "GL" + Date.now(),
    product_id: productId || null,
    product_name: productName || "",
    price: price || 0,
    customer_name: customerName,
    contact: contact,
    payment: payment,
    note: note || "",
    status: "pending",
    created_at: new Date().toLocaleString("zh-CN")
  };
  orders.unshift(order);
  writeJSON(path.join(DATA_DIR, "orders.json"), orders);
  broadcast("new_order", order);
  res.json(order);
});

app.get("/api/admin/orders", (req, res) => {
  const orders = readJSON(path.join(DATA_DIR, "orders.json"), []);
  res.json(orders);
});

app.patch("/api/admin/orders/:orderId/status", (req, res) => {
  const orders = readJSON(path.join(DATA_DIR, "orders.json"), []);
  const orderId = req.params.orderId;
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return res.status(404).json({ error: "订单不存在" });
  const { status } = req.body;
  if (!["pending", "completed", "cancelled"].includes(status)) {
    return res.status(400).json({ error: "无效的状态值" });
  }
  orders[idx].status = status;
  writeJSON(path.join(DATA_DIR, "orders.json"), orders);
  broadcast("order_status_changed", orders[idx]);
  res.json(orders[idx]);
});

app.delete("/api/admin/orders/:orderId", (req, res) => {
  const orders = readJSON(path.join(DATA_DIR, "orders.json"), []);
  const orderId = req.params.orderId;
  const filtered = orders.filter(o => o.id !== orderId);
  writeJSON(path.join(DATA_DIR, "orders.json"), filtered);
  broadcast("order_deleted", { id: orderId });
  res.json({ success: true });
});

// ============================================================
//  设置 API
// ============================================================

app.get("/api/settings", (req, res) => {
  const settings = readJSON(path.join(DATA_DIR, "settings.json"), {});
  res.json(settings);
});

app.put("/api/settings", (req, res) => {
  const settings = req.body;
  const current = readJSON(path.join(DATA_DIR, "settings.json"), {});
  Object.assign(current, settings);
  writeJSON(path.join(DATA_DIR, "settings.json"), current);
  broadcast("settings_updated", current);
  res.json(current);
});

// ============================================================
//  启动
// ============================================================

app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log("  Globelink商行 服务器已启动");
  console.log("  前台: http://localhost:" + PORT);
  console.log("  后台: http://localhost:" + PORT + "/admin.html");
  console.log("  SSE:  http://localhost:" + PORT + "/api/events");
  console.log("  API:  http://localhost:" + PORT + "/api/");
  console.log("=".repeat(50));
});
