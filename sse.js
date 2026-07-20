// SSE (Server-Sent Events) 实时推送模块
const clients = [];

function broadcast(message) {
  const data = JSON.stringify(message);
  // 发送给所有连接的客户端
  clients.forEach(function(socket) {
    try { socket.write('data: ' + data + '\n\n'); } catch(e) {}
  });
}

function handleConnection(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write(':\n\n'); // 初始心跳

  clients.push(res);

  req.on('close', function() {
    const index = clients.indexOf(res);
    if (index > -1) clients.splice(index, 1);
  });
}

// 定期心跳（防止连接超时）
setInterval(function() {
  clients.forEach(function(socket) {
    try { socket.write(': heartbeat\n\n'); } catch(e) {}
  });
}, 15000);

module.exports = { broadcast, handleConnection };
