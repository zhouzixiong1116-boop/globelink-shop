// ============================================================
//  Globelink商行 - 前台脚本（API版本 + SSE实时推送）
// ============================================================

(function() {
  const API = '/api';

  // 分类中文名
  const catNames = { vpn: 'VPN加速', apple: '美区ID', charge: '代充服务', extra: '增值服务' };
  const catIcons = { vpn: '🌐', apple: '🍎', charge: '⚡', extra: '🛠' };

  // 当前站点设置缓存
  let currentSettings = {};

  // ---- 渲染商品列表 ----
  async function renderProducts(filterCat) {
    try {
      const params = filterCat === 'all' ? '' : '?category=' + filterCat;
      const res = await fetch(API + '/products' + params);
      const products = await res.json();
      const container = document.getElementById('products-grid');
      if (!container) return;

      if (products.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#8892b0;grid-column:1/-1;padding:60px 0;">暂无商品，敬请期待...</p>';
        return;
      }

      container.innerHTML = products.map(function(p) {
        var tags = p.tags || [];
        var tagsHtml = tags.map(function(t) { return '<span class="product-tag">' + escapeHtml(t) + '</span>'; }).join('');
        return '<div class="product-card">' +
          '<div class="product-cat">' + (catIcons[p.category] || '') + ' ' + (catNames[p.category] || p.category) + '</div>' +
          '<div class="product-name">' + escapeHtml(p.name) + '</div>' +
          '<div class="product-spec">' + escapeHtml(p.spec) + '</div>' +
          '<div class="product-tags">' + tagsHtml + '</div>' +
          '<div class="product-price">¥' + p.price + '<span></span></div>' +
          (p.description ? '<div class="product-desc">' + escapeHtml(p.description) + '</div>' : '') +
          '<button class="btn-order" onclick="window.openOrder(' + p.id + ',\'' + escapeAttr(p.name) + '\',' + p.price + ')">立即下单</button>' +
          '</div>';
      }).join('');
    } catch (err) {
      console.error('加载商品失败:', err);
      document.getElementById('products-grid').innerHTML = '<p style="text-align:center;color:#ff1744;grid-column:1/-1;padding:60px 0;">⚠️ 服务器连接失败，请确保后端已启动</p>';
    }
  }

  // ---- 渲染全部分类商品（不传参数） ----
  async function renderAllProducts() {
    try {
      const res = await fetch(API + '/products');
      const products = await res.json();
      const container = document.getElementById('products-grid');
      if (!container) return;

      if (products.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#8892b0;grid-column:1/-1;padding:60px 0;">暂无商品，敬请期待...</p>';
        return;
      }

      container.innerHTML = products.map(function(p) {
        var tags = p.tags || [];
        var tagsHtml = tags.map(function(t) { return '<span class="product-tag">' + escapeHtml(t) + '</span>'; }).join('');
        return '<div class="product-card">' +
          '<div class="product-cat">' + (catIcons[p.category] || '') + ' ' + (catNames[p.category] || p.category) + '</div>' +
          '<div class="product-name">' + escapeHtml(p.name) + '</div>' +
          '<div class="product-spec">' + escapeHtml(p.spec) + '</div>' +
          '<div class="product-tags">' + tagsHtml + '</div>' +
          '<div class="product-price">¥' + p.price + '<span></span></div>' +
          (p.description ? '<div class="product-desc">' + escapeHtml(p.description) + '</div>' : '') +
          '<button class="btn-order" onclick="window.openOrder(' + p.id + ',\'' + escapeAttr(p.name) + '\',' + p.price + ')">立即下单</button>' +
          '</div>';
      }).join('');
    } catch (err) {
      console.error('加载商品失败:', err);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function escapeAttr(str) {
    return String(str).replace(/'/g, "\\'").replace(/\\/g, '\\\\');
  }

  // ---- 加载站点设置 ----
  async function loadSettings() {
    try {
      const res = await fetch(API + '/settings');
      currentSettings = await res.json();

      // 更新 Banner
      if (currentSettings.banner_title) {
        document.getElementById('banner-title').textContent = currentSettings.banner_title;
      }
      if (currentSettings.banner_sub) {
        document.getElementById('banner-sub').textContent = currentSettings.banner_sub;
      }

      // 更新页脚
      if (currentSettings.shop_name) {
        document.getElementById('shop-logo').textContent = '🌐 ' + currentSettings.shop_name;
        document.getElementById('footer-shop-name').textContent = '🌐 ' + currentSettings.shop_name;
        document.title = currentSettings.shop_name + ' - 全球网络加速 · 账号代充';
      }
      if (currentSettings.wechat) {
        document.getElementById('footer-wechat').textContent = '微信: ' + currentSettings.wechat;
      }
      if (currentSettings.qq) {
        document.getElementById('footer-qq').textContent = 'QQ: ' + currentSettings.qq;
      }
      if (currentSettings.footer_text) {
        document.getElementById('footer-copyright').textContent = currentSettings.footer_text;
      }
    } catch (err) {
      console.error('加载设置失败:', err);
    }
  }

  // ---- 打开下单弹窗 ----
  window.openOrder = function(productId, productName, price) {
    fetch(API + '/settings')
      .then(function(r) { return r.json(); })
      .then(function(settings) {
        currentSettings = settings;
        document.getElementById('order-product-info').innerHTML =
          '<h3>' + escapeHtml(productName) + '</h3>' +
          '<div class="price">¥' + price + '</div>';

        document.getElementById('order-modal').classList.add('show');
        document.getElementById('order-form').onsubmit = function(e) {
          e.preventDefault();
          var orderData = {
            productId: productId,
            productName: productName,
            price: price,
            customerName: document.getElementById('order-name').value,
            contact: document.getElementById('order-contact').value,
            payment: document.getElementById('order-payment').value,
            note: document.getElementById('order-note').value
          };

          fetch(API + '/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
          })
          .then(function(r) { return r.json(); })
          .then(function(order) {
            alert('订单提交成功！订单号：' + order.id + '\n\n请联系客服完成支付：\n微信: ' + (currentSettings.wechat || 'globelink_support'));
            closeModal();
            document.getElementById('order-form').reset();
          })
          .catch(function(err) {
            alert('订单提交失败，请稍后重试');
            console.error(err);
          });
        };
      })
      .catch(function(err) {
        console.error('获取设置失败:', err);
      });
  };

  window.closeModal = function() {
    document.getElementById('order-modal').classList.remove('show');
  };

  // ---- 筛选按钮 ----
  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      renderProducts(btn.dataset.cat);
    });
  });

  // ============================================================
  //  SSE 实时推送监听
  // ============================================================
  function connectSSE() {
    const evtSource = new EventSource(API + '/events');

    evtSource.onopen = function() {
      console.log('✅ 实时同步已连接');
    };

    evtSource.onmessage = function(event) {
      try {
        var msg = JSON.parse(event.data);
        handleRealtimeEvent(msg);
      } catch (e) {
        // 忽略心跳消息
      }
    };

    evtSource.onerror = function(err) {
      console.warn('⚠️ SSE 连接断开，3秒后重连...');
      evtSource.close();
      // 自动重连
      setTimeout(connectSSE, 3000);
    };
  }

  function handleRealtimeEvent(msg) {
    switch (msg.type) {
      case 'product_created':
      case 'product_updated':
      case 'product_toggled':
        // 商品变化：重新加载所有商品
        renderAllProducts();
        console.log('🔄 商品已更新');
        break;

      case 'product_deleted':
        // 商品被删：重新加载
        renderAllProducts();
        console.log('🗑️ 商品已删除');
        break;

      case 'settings_updated':
        // 设置变更：刷新页面上的设置信息
        currentSettings = msg.payload;
        // 更新 Banner
        if (currentSettings.banner_title) document.getElementById('banner-title').textContent = currentSettings.banner_title;
        if (currentSettings.banner_sub) document.getElementById('banner-sub').textContent = currentSettings.banner_sub;
        // 更新页脚
        if (currentSettings.shop_name) {
          document.getElementById('shop-logo').textContent = '🌐 ' + currentSettings.shop_name;
          document.getElementById('footer-shop-name').textContent = '🌐 ' + currentSettings.shop_name;
          document.title = currentSettings.shop_name + ' - 全球网络加速 · 账号代充';
        }
        if (currentSettings.wechat) document.getElementById('footer-wechat').textContent = '微信: ' + currentSettings.wechat;
        if (currentSettings.qq) document.getElementById('footer-qq').textContent = 'QQ: ' + currentSettings.qq;
        if (currentSettings.footer_text) document.getElementById('footer-copyright').textContent = currentSettings.footer_text;
        console.log('📝 站点设置已更新');
        break;

      case 'new_order':
        console.log('📦 新订单：' + msg.payload.id);
        break;

      case 'order_status_changed':
        console.log('📋 订单状态变更：' + msg.payload.id);
        break;

      default:
        console.log('未知事件：', msg.type);
    }
  }

  // ---- 初始化 ----
  renderAllProducts();
  loadSettings();
  connectSSE();
})();
