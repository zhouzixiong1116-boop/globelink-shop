// ============================================================
//  Globelink商行 - 前台脚本（分区展示 + 在线支付流程）
// ============================================================

(function() {
  const API = '/api';

  // 分类中文名和图标
  const catNames = { vpn: 'VPN加速', apple: '账号服务', charge: '会员充值', extra: '接码服务' };
  const catIcons = { vpn: '🌐', apple: '🔑', charge: '👑', extra: '📱' };

  // 当前站点设置缓存
  let currentSettings = {};

  // 当前订单上下文
  let currentOrderContext = null;

  // ---- 渲染指定分区的商品 ----
  async function renderZoneProducts(category) {
    try {
      const res = await fetch(API + '/products?category=' + category);
      const products = await res.json();
      const container = document.querySelector('.zone-products[data-category="' + category + '"]');
      if (!container) return;

      if (products.length === 0) {
        container.innerHTML = '<p class="zone-empty">本专区暂无商品，敬请期待...</p>';
        return;
      }

      container.innerHTML = '<div class="zone-product-grid">' + products.map(function(p) {
        var tags = p.tags || [];
        var tagsHtml = tags.map(function(t) { return '<span class="product-tag">' + escapeHtml(t) + '</span>'; }).join('');
        return '<div class="product-card">' +
          '<div class="product-cat">' + (catIcons[p.category] || '') + ' ' + (catNames[p.category] || p.category) + '</div>' +
          '<div class="product-name">' + escapeHtml(p.name) + '</div>' +
          '<div class="product-spec">' + escapeHtml(p.spec || '') + '</div>' +
          '<div class="product-tags">' + tagsHtml + '</div>' +
          '<div class="product-price">¥' + escapeHtml(String(p.price)) + '</div>' +
          (p.description ? '<div class="product-desc">' + escapeHtml(p.description) + '</div>' : '') +
          '<button class="btn-order" onclick="window.openOrder(' + p.id + ',\'' + escapeAttr(p.name) + '\',' + p.price + ',\'' + escapeAttr(p.category) + '\')">立即下单</button>' +
          '</div>';
      }).join('') + '</div>';
    } catch (err) {
      console.error('加载商品失败:', err);
    }
  }

  // ---- 渲染所有分区 ----
  async function renderAllZones() {
    const categories = ['vpn', 'apple', 'charge', 'extra'];
    for (const cat of categories) {
      await renderZoneProducts(cat);
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
        document.title = currentSettings.shop_name + ' - 全球网络加速 · 一站式数字服务';
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
  window.openOrder = function(productId, productName, price, category) {
    fetch(API + '/settings')
      .then(function(r) { return r.json(); })
      .then(function(settings) {
        currentSettings = settings;
        document.getElementById('order-product-info').innerHTML =
          '<h3>' + escapeHtml(productName) + '</h3>' +
          '<p>分类: ' + (catNames[category] || category) + '</p>' +
          '<div class="price">¥' + price + '</div>';

        document.getElementById('order-modal').classList.add('show');
        document.getElementById('order-form').onsubmit = function(e) {
          e.preventDefault();
          var orderData = {
            productId: productId,
            productName: productName,
            price: price,
            category: category,
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
            // 关闭下单弹窗，打开支付弹窗
            closeModal();
            showPaymentModal(order);
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

  // ---- 展示支付弹窗 ----
  function showPaymentModal(order) {
    currentOrderContext = order;
    var payMethod = order.payment || 'wechat';
    var payLabel = { wechat: '微信支付', alipay: '支付宝', usdt: 'USDT' }[payMethod] || payMethod;

    // 填充摘要
    document.getElementById('payment-summary').innerHTML =
      '<div class="summary-row"><span>订单号</span><strong>' + escapeHtml(order.id) + '</strong></div>' +
      '<div class="summary-row"><span>商品</span><span>' + escapeHtml(order.product_name) + '</span></div>' +
      '<div class="summary-row"><span>金额</span><strong class="summary-price">¥' + order.price + '</strong></div>' +
      '<div class="summary-row"><span>支付方式</span><span>' + payLabel + '</span></div>';

    // 加载收款码
    loadPaymentQR(payMethod, order.id);

    document.getElementById('payment-modal').classList.add('show');
  }

  // ---- 加载收款码 ----
  function loadPaymentQR(paymentMethod, orderId) {
    var qrImg = document.getElementById('payment-qr-img');
    var placeholder = document.getElementById('qr-placeholder');

    placeholder.style.display = 'block';
    qrImg.style.display = 'none';

    fetch(API + '/payment/qr?method=' + paymentMethod)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        placeholder.style.display = 'none';
        if (data.qr_url) {
          qrImg.src = data.qr_url;
          qrImg.style.display = 'block';
        } else {
          placeholder.innerHTML = '<p>⚠️ 暂未配置 ' + ({wechat:'微信',alipay:'支付宝',usdt:'USDT'}[paymentMethod] || paymentMethod) + ' 收款码</p>' +
            '<p style="font-size:12px;color:#8892b0;margin-top:8px;">请联系客服手动完成支付</p>';
          placeholder.style.display = 'block';
        }
      })
      .catch(function(err) {
        console.error('加载收款码失败:', err);
        placeholder.innerHTML = '<p>⚠️ 收款码加载失败</p>';
        placeholder.style.display = 'block';
      });

    // 设置微信跳转链接
    var wechatLink = document.getElementById('wechat-redirect-link');
    if (currentSettings && currentSettings.wechat) {
      // 尝试构造搜索或添加好友链接
      wechatLink.href = 'https://weixin.sogou.com/weixin?type=2&query=' + encodeURIComponent(currentSettings.wechat);
    } else {
      wechatLink.href = '#';
    }
  }

  window.closePaymentModal = function() {
    document.getElementById('payment-modal').classList.remove('show');
  };

  // ---- 标记已支付 ----
  window.markPaid = function() {
    if (!currentOrderContext) return;
    fetch(API + '/orders/' + currentOrderContext.id + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    })
    .then(function() {
      alert('✅ 已通知发货！商家确认后将为您交付商品。\n\n客服微信: ' + (currentSettings.wechat || 'globelink_support'));
      closePaymentModal();
    })
    .catch(function() {
      alert('操作失败，请稍后重试');
    });
  };

  window.closeModal = function() {
    document.getElementById('order-modal').classList.remove('show');
  };

  // ---- SSE 实时推送 ----
  function connectSSE() {
    var evtSource = new EventSource(API + '/events');

    evtSource.onopen = function() {
      console.log('✅ 实时同步已连接');
    };

    evtSource.onmessage = function(event) {
      try {
        var msg = JSON.parse(event.data);
        handleRealtimeEvent(msg);
      } catch (e) {}
    };

    evtSource.onerror = function(err) {
      console.warn('⚠️ SSE 连接断开，3秒后重连...');
      evtSource.close();
      setTimeout(connectSSE, 3000);
    };
  }

  function handleRealtimeEvent(msg) {
    switch (msg.type) {
      case 'product_created':
      case 'product_updated':
      case 'product_toggled':
      case 'product_deleted':
        renderAllZones();
        break;
      case 'settings_updated':
        currentSettings = msg.payload || {};
        loadSettings();
        break;
    }
  }

  // ---- 初始化 ----
  renderAllZones();
  loadSettings();
  connectSSE();
})();
