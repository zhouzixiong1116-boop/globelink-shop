const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Railway 使用 PORT 环境变量，通常是 8080
const PORT = process.env.PORT || 3000;

console.log('========================================');
console.log('  Globelink商行 服务器启动中...');
console.log('  PORT 环境变量: ' + process.env.PORT);
console.log('  使用端口: ' + PORT);
console.log('========================================');

// ============================================
//  中间件
// ============================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
//  API 路由（必须在静态文件之前）
// ============================================
app.use('/api', require('./routes/products'));
app.use('/api', require('./routes/orders'));
app.use('/api', require('./routes/settings'));
app.use('/api', require('./routes/payment'));

// SSE 实时推送
const sse = require('./sse');
app.get('/api/events', sse.handleConnection);

// ============================================
//  静态文件服务
// ============================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname)));

// ============================================
//  健康检查
// ============================================
app.get('/health', function(req, res) {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ============================================
//  启动服务器
// ============================================
app.listen(PORT, function() {
  console.log('========================================');
  console.log('  Globelink商行 服务器已启动');
  console.log('  端口: ' + PORT);
  console.log('  前台: http://localhost:' + PORT);
  console.log('  后台: http://localhost:' + PORT + '/admin.html');
  console.log('========================================');
});