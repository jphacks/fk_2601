// 見本の HTML で、ボタンの切り替えなど小さな動きを再現するためのスクリプト（アプリのコードではない）

// data-on="名前" の要素にクリック時の処理をつける
function on(name, fn) {
  document.querySelectorAll('[data-on="' + name + '"]').forEach(function (el) {
    el.addEventListener('click', fn);
  });
}

// どれか1つだけ選べるボタンの組（押したものだけ attr="true" にする）
function group(selector, attr, callback) {
  var items = Array.prototype.slice.call(document.querySelectorAll(selector));
  items.forEach(function (item) {
    item.addEventListener('click', function () {
      items.forEach(function (x) { x.setAttribute(attr, String(x === item)); });
      if (callback) callback(item);
    });
  });
}
