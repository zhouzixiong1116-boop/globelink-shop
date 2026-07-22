document.addEventListener('DOMContentLoaded', function() {
  fetch('/api/products')
    .then(r => r.json())
    .then(products => {
      const container = document.getElementById('products-list');
      products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = '<h3>' + p.name + '</h3><p class="desc">' + (p.description || '') + '</p><p class="price">¥' + p.price + '</p><button class="btn-order" onclick="orderProduct(' + p.id + ')">立即购买</button>';
        container.appendChild(card);
      });
    })
    .catch(err => {
      console.error('加载失败:', err);
      document.getElementById('products-list').innerHTML = '<p style="text-align:center;color:red;">暂无商品或API未就绪</p>';
    });
});

function orderProduct(id) {
  alert('请联系客服下单: 微信 globelink_support');
}