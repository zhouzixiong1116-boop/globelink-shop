// ============================================================
//  Globelink商行 - 后台管理脚本（API版本 + SSE实时推送）
// ============================================================

(function() {
  const API = '/api';
  const catNames = { vpn: 'VPN加速', apple: '美区ID', charge: '代充服务', extra: '增值服务' };
  const payNames = { wechat: '微信', alipay: '支付宝', usdt: 'USDT' };

  // 渲染商品表格
  async function renderProductsTable() {
    try {
      const res = await fetch(API + '/admin/products');
      const products = await res.json();
      const tbody = document.getElementById('products-table-body');
      tbody.innerHTML = products.map(function(p) {
        var statusClass = p.status === 'active' ? 'status-active' : 'status-inactive';
        var statusText = p.status === 'active' ? '上架' : '下架';
        return '<tr>' +
          '<td>' + p.id + '</td>' +
          '<td>' + escapeHtml(p.name) + '</td>' +
          '<td>' + (catNames[p.category] || p.category) + '</td>' +
          '<td>¥' + p.price + '</td>' +
          '<td class="' + statusClass + '">' + statusText + '</td>' +
          '<td>' +
            '<button class="btn-sm btn-edit" onclick="editProduct(' + p.id + ')">编辑</button>' +
            '<button class="btn-sm btn-toggle" onclick="toggleProduct(' + p.id + ')">' + (p.status === 'active' ? '下架' : '上架') + '</button>' +
            '<button class="btn-sm btn-delete" onclick="deleteProduct(' + p.id + ')">删除</button>' +
          '</td>' +
          '</tr>';
      }).join('');
    } catch (err) {
      console.error('加载商品失败:', err);
    }
  }

  // 渲染订单表格
  async function renderOrdersTable() {
    try {
      const res = await fetch(API + '/admin/orders');
      const orders = await res.json();
      const tbody = document.getElementById('orders-table-body');
      if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#8892b0;padding:40px;">暂无订单</td></tr>';
        return;
      }
      tbody.innerHTML = orders.map(function(o) {
        var statusClass = 'status-' + o.status;
        var statusText = { pending: '待处理', completed: '已完成', cancelled: '已取消' }[o.status] || o.status;
        return '<tr>' +
          '<td style="font-size:11px;">' + escapeHtml(o.id) + '</td>' +
          '<td>' + escapeHtml(o.product_name) + '</td>' +
          '<td>' + escapeHtml(o.customer_name) + '</td>' +
          '<td>' + escapeHtml(o.contact) + '</td>' +
          '<td>' + (payNames[o.payment] || o.payment) + '</td>' +
          '<td>¥' + o.price + '</td>' +
          '<td class="' + statusClass + '">' + statusText + '</td>' +
          '<td>' +
            '<button class="btn-sm btn-toggle" onclick="completeOrder(\'' + escapeAttr(o.id) + '\')">完成</button>' +
            '<button class="btn-sm btn-delete" onclick="cancelOrder(\'' + escapeAttr(o.id) + '\')">取消</button>' +
          '</td>' +
          '</tr>';
      }).join('');
    } catch (err) {
      console.error('加载订单失败:', err);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function escapeAttr(str) {
    return String(str).replace(/'/g, "\\'").replace(/\\/g, '\\\\');
  }

  // Tab切换
  document.querySelectorAll('.sidebar-menu li').forEach(function(li) {
    li.addEventListener('click', function() {
      document.querySelectorAll('.sidebar-menu li').forEach(function(l) { l.classList.remove('active'); });
      li.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(function(tc) { tc.classList.remove('active'); });
      document.getElementById('tab-' + li.dataset.tab).classList.add('active');
    });
  });

  // 打开商品表单
  window.openProductForm = function(id) {
    document.getElementById('product-modal').classList.add('show');
    if (id) {
      fetch(API + '/admin/products')
        .then(function(r) { return r.json(); })
        .then(function(products) {
          var p = products.find(function(x) { return x.id === id; });
          if (p) {
            document.getElementById('product-modal-title').textContent = '编辑商品';
            document.getElementById('prod-edit-id').value = p.id;
            document.getElementById('prod-name').value = p.name;
            document.getElementById('prod-category').value = p.category;
            document.getElementById('prod-price').value = p.price;
            document.getElementById('prod-spec').value = p.spec || '';
            document.getElementById('prod-tags').value = Array.isArray(p.tags) ? p.tags.join(',') : '';
            document.getElementById('prod-desc').value = p.description || '';
            document.getElementById('prod-status').value = p.status || 'active';
          }
        });
    } else {
      document.getElementById('product-modal-title').textContent = '添加商品';
      document.getElementById('prod-edit-id').value = '';
      document.getElementById('product-form').reset();
    }
  };

  window.closeProductModal = function() {
    document.getElementById('product-modal').classList.remove('show');
  };

  // 保存商品
  document.getElementById('product-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const editId = document.getElementById('prod-edit-id').value;
    const tagsStr = document.getElementById('prod-tags').value;
    const tags = tagsStr ? tagsStr.split(',').map(function(t) { return t.trim(); }).filter(function(t) { return t; }) : [];

    const productData = {
      name: document.getElementById('prod-name').value,
      category: document.getElementById('prod-category').value,
      price: parseFloat(document.getElementById('prod-price').value),
      spec: document.getElementById('prod-spec').value,
      tags: tags,
      description: document.getElementById('prod-desc').value,
      status: document.getElementById('prod-status').value
    };

    const url = editId ? API + '/admin/products/' + editId : API + '/admin/products';
    const method = editId ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    })
    .then(function(r) { return r.json(); })
    .then(function() {
      renderProductsTable();
      closeProductModal();
      alert(editId ? '商品已更新' : '商品已添加');
    })
    .catch(function(err) {
      alert('操作失败');
      console.error(err);
    });
  });

  // 编辑/下架/删除
  window.editProduct = function(id) { window.openProductForm(id); };

  window.toggleProduct = function(id) {
    fetch(API + '/admin/products/' + id + '/toggle', { method: 'PATCH' })
      .then(function(r) { return r.json(); })
      .then(function() { renderProductsTable(); });
  };

  window.deleteProduct = function(id) {
    if (!confirm('确定要删除这个商品吗？')) return;
    fetch(API + '/admin/products/' + id, { method: 'DELETE' })
      .then(function() { renderProductsTable(); });
  };

  // 订单操作
  window.completeOrder = function(orderId) {
    fetch(API + '/admin/orders/' + orderId + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    })
    .then(function() { renderOrdersTable(); });
  };

  window.cancelOrder = function(orderId) {
    fetch(API + '/admin/orders/' + orderId + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' })
    })
    .then(function() { renderOrdersTable(); });
  };

  // 导出订单
  window.exportOrders = function() {
    fetch(API + '/admin/orders')
      .then(function(r) { return r.json(); })
      .then(function(orders) {
        if (orders.length === 0) { alert('暂无订单可导出'); return; }
        let csv = '\uFEFF订单号,商品,客户,联系方式,支付,金额,状态,时间\r\n';
        orders.forEach(function(o) {
          csv += o.id + ',' + o.product_name + ',' + o.customer_name + ',' + o.contact + ',' + (payNames[o.payment]||o.payment) + ',' + o.price + ',' + o.status + ',' + o.created_at + '\r\n';
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'orders_' + new Date().toISOString().slice(0,10) + '.csv';
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  // 加载设置
  async function loadSettings() {
    try {
      const res = await fetch(API + '/settings');
      const settings = await res.json();
      if (settings.shop_name) document.getElementById('setting-shop-name').value = settings.shop_name;
      if (settings.wechat) document.getElementById('setting-wechat').value = settings.wechat;
      if (settings.qq) document.getElementById('setting-qq').value = settings.qq;
      if (settings.usdt) document.getElementById('setting-usdt').value = settings.usdt;
      if (settings.banner_title) document.getElementById('setting-banner-title').value = settings.banner_title;
      if (settings.banner_sub) document.getElementById('setting-banner-sub').value = settings.banner_sub;
      if (settings.footer_text) document.getElementById('setting-footer-text').value = settings.footer_text;
    } catch (err) { console.error('加载设置失败:', err); }
  }

  // 保存设置
  window.saveSettings = function() {
    const settings = {
      shop_name: document.getElementById('setting-shop-name').value,
      wechat: document.getElementById('setting-wechat').value,
      qq: document.getElementById('setting-qq').value,
      usdt: document.getElementById('setting-usdt').value,
      banner_title: document.getElementById('setting-banner-title').value,
      banner_sub: document.getElementById('setting-banner-sub').value,
      footer_text: document.getElementById('setting-footer-text').value,
    };
    fetch(API + '/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
    .then(function() { alert('设置已保存'); });
  };

  // ============================================================
  //  SSE 实时推送监听（后台也能看到前台的变化）
  // ============================================================
  function connectAdminSSE() {
    const evtSource = new EventSource(API + '/events');

    evtSource.onopen = function() {
      console.log('✅ 后台实时同步已连接');
    };

    evtSource.onmessage = function(event) {
      try {
        var msg = JSON.parse(event.data);
        handleAdminRealtimeEvent(msg);
      } catch (e) {
        // 忽略心跳消息
      }
    };

    evtSource.onerror = function(err) {
      console.warn('⚠️ 后台 SSE 连接断开，3秒后重连...');
      evtSource.close();
      setTimeout(connectAdminSSE, 3000);
    };
  }

  function handleAdminRealtimeEvent(msg) {
    // 当有前台提交新订单时，后台自动刷新订单列表
    if (msg.type === 'new_order') {
      renderOrdersTable();
      console.log('📦 收到新订单通知');
    }
    // 订单状态变更
    if (msg.type === 'order_status_changed') {
      renderOrdersTable();
    }
  }

  // 初始化
  renderProductsTable();
  renderOrdersTable();
  loadSettings();
  connectAdminSSE();
})();
