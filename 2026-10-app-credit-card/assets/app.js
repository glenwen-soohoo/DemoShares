/* ==========================================================================
   App 信用卡改走 TapPay — demo 共用腳本（純 demo 工具：圖示、系統選單、Alert、情境面板、頁間參數）
   頁與頁之間只用網址參數帶「情境」（金額、平台、存卡狀態…），不帶任何個資。
   ========================================================================== */
(function () {
  // Ionicons（outline）路徑，App 用 @react-native-vector-icons/ionicons
  var P = {
    'chevron-back': '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M328 112L184 256l144 144"/>',
    'chevron-forward': '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M184 112l144 144-144 144"/>',
    'chevron-down': '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M112 184l144 144 144-144"/>',
    'chevron-up': '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M112 328l144-144 144 144"/>',
    'checkmark': '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="40" d="M416 128L192 384l-96-96"/>',
    'close': '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M368 368L144 144M368 144L144 368"/>',
    'help-circle': '<path d="M256 80a176 176 0 10176 176A176 176 0 00256 80z" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32"/><path d="M200 202.29s.84-17.5 19.57-32.57C230.68 160.77 244 158.18 256 158c10.93-.14 20.69 1.67 26.53 4.45 10 4.76 29.47 16.38 29.47 41.09 0 26-17 37.81-36.37 50.8S251 281.43 251 296" fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="28"/><circle fill="currentColor" cx="250" cy="348" r="20"/>',
    'checkmark-circle': '<path d="M448 256c0-106-86-192-192-192S64 150 64 256s86 192 192 192 192-86 192-192z" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M352 176L217.6 336 160 272"/>',
    'alert-circle': '<path d="M448 256c0-106-86-192-192-192S64 150 64 256s86 192 192 192 192-86 192-192z" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32"/><path d="M250.26 166.05L256 288l5.73-121.95a5.74 5.74 0 00-5.79-6h0a5.74 5.74 0 00-5.68 6z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><circle fill="currentColor" cx="256" cy="367.91" r="20"/>'
  };
  function ion(name) { return '<svg class="ion" viewBox="0 0 512 512" aria-hidden="true">' + (P[name] || '') + '</svg>'; }
  function paintIcons(root) {
    (root || document).querySelectorAll('i[data-ion]').forEach(function (el) {
      el.outerHTML = ion(el.getAttribute('data-ion'));
    });
  }

  // ---- 網址參數 ----
  var Q = new URLSearchParams(location.search);
  function q(k, d) { var v = Q.get(k); return v === null || v === '' ? d : v; }
  function url(page, params) {
    var u = new URLSearchParams();
    Object.keys(params || {}).forEach(function (k) { if (params[k] !== undefined && params[k] !== null) u.set(k, params[k]); });
    var s = u.toString();
    return page + (s ? '?' + s : '');
  }
  function money(n) { return '$' + Number(n).toLocaleString('en-US'); }

  // ---- 框內圖層 ----
  function frame() { return document.querySelector('.app'); }
  function layer(html, onMask) {
    var el = document.createElement('div');
    el.className = 'layer show';
    el.innerHTML = '<div class="mask"></div>' + html;
    frame().appendChild(el);
    el.querySelector('.mask').addEventListener('click', function () { close(); if (onMask) onMask(); });
    function close() { el.remove(); }
    return { el: el, close: close };
  }

  // PickerSelect：iOS ActionSheetIOS（選項＋「取消」）；Android @react-native-picker/picker dialog 模式
  function picker(opts) {
    var plat = opts.platform || 'ios';
    if (plat === 'android') {
      var h = '<div class="adialog">' + opts.options.map(function (o, i) {
        return '<button type="button" data-i="' + i + '" class="' + (String(o.value) === String(opts.value) ? 'on' : '') + '"><span class="radio"></span>' + o.label + '</button>';
      }).join('') + '</div>';
      var L = layer(h);
      L.el.querySelectorAll('button[data-i]').forEach(function (b) {
        b.addEventListener('click', function () { L.close(); opts.onPick(opts.options[+b.dataset.i].value); });
      });
      return;
    }
    var hi = '<div class="sheet"><div class="sheet-grp">' + opts.options.map(function (o, i) {
      return '<button type="button" data-i="' + i + '">' + o.label + '</button>';
    }).join('') + '</div><div class="sheet-grp sheet-cancel"><button type="button" data-cancel>取消</button></div></div>';
    var L2 = layer(hi);
    L2.el.querySelectorAll('button[data-i]').forEach(function (b) {
      b.addEventListener('click', function () { L2.close(); opts.onPick(opts.options[+b.dataset.i].value); });
    });
    L2.el.querySelector('[data-cancel]').addEventListener('click', L2.close);
  }

  // RN Alert.alert（iOS 樣式；Android 以同一個對話框示意）
  function alert(o) {
    var h = '<div class="alert"><div class="at">' + o.title + '</div>' + (o.message ? '<div class="am">' + o.message + '</div>' : '<div class="am"></div>') +
      '<div class="ab">' + o.buttons.map(function (b, i) {
        return '<button type="button" data-i="' + i + '" class="' + (b.style || '') + '">' + b.text + '</button>';
      }).join('') + '</div></div>';
    var L = layer(h);
    L.el.querySelector('.mask').replaceWith(Object.assign(document.createElement('div'), { className: 'mask' }));
    L.el.querySelectorAll('.ab button').forEach(function (b) {
      b.addEventListener('click', function () { L.close(); var fn = o.buttons[+b.dataset.i].onPress; if (fn) fn(); });
    });
  }

  // Switch
  function bindSwitch(el, onChange) {
    el.addEventListener('click', function () {
      el.classList.toggle('on');
      el.setAttribute('aria-checked', el.classList.contains('on'));
      if (onChange) onChange(el.classList.contains('on'));
    });
  }

  // ---- 情境面板 ----
  // groups: [{label, value, options:[[value,label],...], onChange}]；buttons: [{label, onClick}]
  function devPanel(cfg) {
    var el = document.createElement('div');
    el.className = 'devpanel';
    var key = 'tp-demo-devpanel-collapsed';
    try { if (localStorage.getItem(key) === '1') el.classList.add('collapsed'); } catch (e) { }
    var h = '<div class="devpanel-hd"><span>開發預覽面板</span><button type="button" title="收合／展開">' + (el.classList.contains('collapsed') ? '＋' : '－') + '</button></div><div class="devpanel-bd">';
    (cfg.groups || []).forEach(function (g, gi) {
      h += '<div class="devgrp"><span>' + g.label + '</span><div class="devseg" data-g="' + gi + '">' +
        g.options.map(function (o) { return '<button type="button" data-v="' + o[0] + '" class="' + (String(o[0]) === String(g.value) ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') +
        '</div></div>';
    });
    (cfg.buttons || []).forEach(function (b, bi) { h += '<button type="button" class="devbtn" data-b="' + bi + '">' + b.label + '</button>'; });
    h += '<p class="devnote">' + (cfg.note ? cfg.note + ' ' : '') + '此面板僅供預覽，正式 App 不會有。</p></div>';
    el.innerHTML = h;
    document.body.appendChild(el);
    var tg = el.querySelector('.devpanel-hd button');
    tg.addEventListener('click', function () {
      el.classList.toggle('collapsed');
      var c = el.classList.contains('collapsed');
      tg.textContent = c ? '＋' : '－';
      try { localStorage.setItem(key, c ? '1' : '0'); } catch (e) { }
    });
    el.querySelectorAll('.devseg').forEach(function (seg) {
      var g = cfg.groups[+seg.dataset.g];
      seg.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          seg.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
          b.classList.add('on');
          g.onChange(b.dataset.v);
        });
      });
    });
    el.querySelectorAll('.devbtn').forEach(function (b) {
      b.addEventListener('click', function () { cfg.buttons[+b.dataset.b].onClick(); });
    });
    return {
      set: function (gi, v) {
        var seg = el.querySelector('.devseg[data-g="' + gi + '"]');
        if (!seg) return;
        seg.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x.dataset.v === String(v)); });
      }
    };
  }

  // ---- 共用假資料 ----
  // 三種購物車金額，對應分期門檻：未滿 3,000／3,000～5,999（可 3 期）／滿 6,000（可 3、6 期）
  var CARTS = {
    '2480': {
      items: [
        { name: '小家庭蔬菜箱', spec: '1箱(8樣)', price: 1290, qty: 1 },
        { name: '溫室玉女小番茄', spec: '1盒(600g)', price: 520, qty: 2 }
      ], shipping: 150, discount: 0
    },
    '3980': {
      items: [
        { name: '小家庭蔬菜箱', spec: '1箱(8樣)', price: 1290, qty: 1 },
        { name: '溫室玉女小番茄', spec: '1盒(600g)', price: 520, qty: 2 },
        { name: '放牧土雞蛋', spec: '30顆(盒裝)', price: 750, qty: 2 }
      ], shipping: 150, discount: 0
    },
    '7245': {
      items: [
        { name: '中家庭蔬菜箱', spec: '1箱(12樣)', price: 1980, qty: 2 },
        { name: '溫室玉女小番茄', spec: '1盒(600g)', price: 520, qty: 2 },
        { name: '放牧土雞蛋', spec: '30顆(盒裝)', price: 750, qty: 2 },
        { name: '台農57號地瓜', spec: '5kg(箱)', price: 820, qty: 1 }
      ], shipping: 0, discount: 75
    }
  };
  function cartTotal(amt) {
    var c = CARTS[amt]; var sum = 0;
    c.items.forEach(function (i) { sum += i.price * i.qty; });
    return { products: sum, shipping: c.shipping, discount: c.discount, total: sum + c.shipping - c.discount };
  }
  // 分期期數：實付總額（含運、折後）< 3,000 只能一次付清；≥ 3,000 開 3 期；≥ 6,000 開 3、6 期
  function instalmentPlans(total) {
    var plans = [];
    if (total >= 3000) plans.push(3);
    if (total >= 6000) plans.push(6);
    return plans;
  }
  // 每期 = 無條件捨去(總額 ÷ 期數)，餘數併入首期（實際拆法以發卡行為準）
  function perPeriod(total, n) {
    var each = Math.floor(total / n);
    return { each: each, first: each + (total - each * n) };
  }
  var SAVED_CARD = { brand: 'VISA', last4: '5582' };   // TapPayCards.CardNum 顯示用
  var LEGACY_LAST4 = '0371';                           // 綠界時代 App 存過的卡
  var ORDER_NO = '261008902145';                       // yymmdd + 訂單 Id

  window.TP = {
    ion: ion, paintIcons: paintIcons, q: q, url: url, money: money,
    picker: picker, alert: alert, bindSwitch: bindSwitch, devPanel: devPanel,
    CARTS: CARTS, cartTotal: cartTotal, instalmentPlans: instalmentPlans, perPeriod: perPeriod,
    SAVED_CARD: SAVED_CARD, LEGACY_LAST4: LEGACY_LAST4, ORDER_NO: ORDER_NO
  };
  document.addEventListener('DOMContentLoaded', function () { paintIcons(); });
})();
