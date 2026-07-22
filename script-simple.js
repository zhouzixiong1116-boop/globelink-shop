document.addEventListener('DOMContentLoaded', function() {
  fetch('/api/products')
    .then(r => r.json())
    .then(products => {
      const container = document.getElementById('products-list');
      if (products.length === 0) {
        container.innerHTML = '<p style=\"text-align:center;color:#999;\">暂无商品，请联系客服</p>';
        return;
      }
      products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = '<h3>' + p.name + '</h3><p class=\"desc\">' + (p.description || p.spec || '') + '</p><p class=\"price\">￥' + p.price + '</p><button class=\"btn-order\" onclick=\"orderProduct(' + p.id + ',\\'' + p.name + '\\',\\'' + p.price + '\\')\">立即购买</button>';
        container.appendChild(card);
      });
    })
    .catch(err => {
      console.error('加载失败:', err);
      document.getElementById('products-list').innerHTML = '<p style=\"text-align:center;color:red;\">加载失败，请稍后重试</p>';
    });
});

function orderProduct(id, name, price) {
  window.location.href = 'admin.html';
}