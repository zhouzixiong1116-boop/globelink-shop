# 🌐 Globelink商行 — 独立站部署指南

## 项目结构

```
📁 Globelink商行/
├── frontend/               # 前端文件
│   ├── index.html          # 前台首页
│   ├── admin.html          # 后台管理
│   ├── style.css           # 样式文件
│   ├── script.js           # 前台逻辑（含 SSE 实时同步）
│   └── admin.js            # 后台逻辑
├── backend/                # 后端服务
│   ├── server.js           # Express 服务器（含 SSE 推送）
│   ├── package.json        # 依赖配置
│   ├── .env.example        # 环境变量模板
│   ├── start.bat           # Windows 启动脚本
│   └── data/               # 数据存储（自动生成）
│       ├── products.json   # 商品数据
│       ├── orders.json     # 订单数据
│       └── settings.json   # 站点设置
├── Procfile                # Railway 部署配置
├── railway.json            # Railway 构建配置
├── .gitignore
└── README.md
```

## 快速开始

### 前置条件

- 安装 [Node.js](https://nodejs.org/)（推荐 LTS 版本）

### 本地启动

1. 打开 `backend/` 文件夹
2. 安装依赖：`npm install`
3. 启动服务：`npm start` 或双击 `start.bat`
4. 浏览器打开 http://localhost:3000

### 功能说明

#### 前台（客户端）

- 商品分类浏览（VPN / 美区ID / 代充 / 增值服务）
- 商品卡片展示（价格、规格、标签、描述）
- 在线下单（填写姓名、联系方式、支付方式）
- **🔄 SSE 实时同步** — 后台修改后前台自动刷新，无需手动刷新页面
- 响应式设计，支持手机端和电脑端

#### 后台（管理端）

- **商品管理**：添加 / 编辑 / 删除 / 上架 / 下架
- **订单管理**：查看所有订单、标记完成/取消、导出 CSV
- **站点设置**：修改店铺名、客服微信、QQ、USDT地址、Banner文案、底部版权文字
- **🔄 SSE 实时同步** — 前台有新订单时后台自动刷新

## 访问地址

| 位置 | 地址 |
|------|------|
| 前台 | http://localhost:3000 |
| 后台 | http://localhost:3000/admin.html |
| SSE 实时推送 | http://localhost:3000/api/events |

## 部署到公网

### 方案一：Railway 部署（推荐 ⭐）

Railway 支持 Node.js 长期运行，完美兼容 SSE 实时推送。

#### 步骤

1. 注册 Railway: https://railway.app/signup
2. 将项目推送到 GitHub
3. 在 Railway 点击 "New Project" → "Import from GitHub"
4. Railway 会自动识别 `Procfile` 并部署
5. 部署完成后获取公网地址，例如 `https://xxx.railway.app`

#### 配置环境变量（可选）

在 Railway Dashboard → Settings → Variables 中添加：
```
PORT=3000
ADMIN_PASSWORD=your_password
```

### 方案二：Render 部署

Render 同样支持长期运行的 Web 服务。

1. 注册: https://render.com
2. 点击 "New Web Service" → 连接 GitHub 仓库
3. 配置：
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
   - **Instance Type**: Free（测试）或 Starter
4. 部署完成后获取公网地址

### 方案三：VPS 部署（推荐长期使用）

#### 1. 服务器准备

```bash
# 安装 Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2 进程管理器
sudo npm install -g pm2
```

#### 2. 部署项目

```bash
# 克隆或上传项目到服务器
cd /var/www/globelink
npm install

# 启动服务
pm2 start backend/server.js --name globelink-shop
pm2 save
pm2 startup
```

#### 3. 配置 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 方案四：ngrok 内网穿透（快速测试）

```bash
# 下载 ngrok: https://ngrok.com/download
ngrok http 3000
```

获得公网地址，例如: `https://abc123.ngrok-free.app`

> ⚠️ ngrok 免费版每次重启域名会变化，适合临时测试

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | HTML5 + CSS3 + Vanilla JavaScript |
| 后端 | Node.js + Express |
| 实时同步 | SSE (Server-Sent Events) |
| 数据库 | JSON 文件存储 |
| 部署 | Railway / Render / VPS / ngrok |

## 数据安全

- 所有数据存储在 `backend/data/` 目录下
- 定期备份 `data/` 文件夹即可
- 后台管理密码默认: `gl2026secure`（请修改！）
- 生产环境建议添加 HTTPS

## 常见问题

### Q: 为什么不能部署到 Netlify/Vercel 静态托管？

SSE（Server-Sent Events）需要**长期运行的服务端连接**，而 Netlify/Vercel 的静态托管不支持持久连接。你需要一个支持 Node.js 的服务端平台（如 Railway、Render、VPS）。

### Q: 如何修改后台管理密码？

编辑 `frontend/admin.html` 中的密码变量：
```javascript
var pwd = '你的新密码';
```

### Q: 数据如何备份？

只需备份 `backend/data/` 目录下的三个 JSON 文件：
- `products.json` — 商品信息
- `orders.json` — 订单记录
- `settings.json` — 站点设置

### Q: 如何迁移到新服务器？

1. 复制整个项目文件夹到新服务器
2. 安装 Node.js 和依赖：`npm install`
3. 启动服务：`node server.js`
4. 数据会自动从 `data/` 目录加载
