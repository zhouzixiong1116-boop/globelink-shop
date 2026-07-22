(function() {
  var API = '/api';
  function escapeHtml(str) { if (!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  async function renderProducts() {
    try {
      var res = await fetch(API + '/admin/products');
      var products = await res.json();
      var tbody = document.getElementById('products-table-body');
      if (products.length === 0) { tbody.innerHTML = '<tr><td colspan=6 style=text-align:center;color=#8892b0;padding:40px>暂无商品</td></tr>'; return; }
      tbody.innerHTML = products.map(function(p) { return '<tr><td>' + p.id + '</td><td>' + escapeHtml(p.name) + '</td><td>' + escapeHtml(p.category) + '</td><td>￥' + p.price + '</td><td>' + (p.status=='active'?'上架':'下架') + '</td><td><button onclick=deleteProduct(' + p.id + ')>删除</button></td></tr>'; }).join('');
    } catch(err) { console.error(err); }
  }
  window.saveProduct = function() {
    var name = document.getElementById('prod-name').value;
    var category = document.getElementById('prod-category').value;
    var price = parseFloat(document.getElementById('prod-price').value);
    if (!name || !price) { alert('请填写名称和价格'); return; }
    fetch(API + '/admin/products', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({name, category, price}) }).then(function() { document.getElementById('prod-form').reset(); closeModal('product-modal'); renderProducts(); });
  };
  window.deleteProduct = function(id) { if(!confirm('删除?')) return; fetch(API + '/admin/products/' + id, {method:'DELETE'}).then(function(){renderProducts();}); };
  window.openModal = function(id) { document.getElementById(id).classList.add('show'); };
  window.closeModal = function(id) { document.getElementById(id).classList.remove('show'); };
  renderProducts();
})();