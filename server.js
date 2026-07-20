const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
//  中间件
// ============================================
app.use(cors());
app.use(express.json({ limit: '10mb' })); // 支持 base64 图片上传
app.use(express.urlencoded({ extended: true }));

// ============================================
//  静态文件服务
// ============================================
// 上传的收款码图片
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// 前台 + 后台 HTML/CSS/JS
app.use(express.static(path.join(__dirname)));

// ============================================
//  SSE 实时推送
// ============================================
const sse = require('./sse');
app.get('/api/events', sse.handleConnection);

// ============================================
//  API 路由
// ============================================
app.use('/api', require('./routes/products'));
app.use('/api', require('./routes/orders'));
app.use('/api', require('./routes/settings'));
app.use('/api', require('./routes/payment'));

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
