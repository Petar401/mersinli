// Menu page: build a tantuni, order gözleme on its own, add drinks, keep a basket in localStorage, demo checkout.
(function () {
  'use strict';

  var MEATS = {
    chicken: { name: 'Chicken', price: 6.5, img: '/assets/img/tantuni-plate-white.jpg' },
    mix: { name: 'Beef and lamb', price: 6.5, img: '/assets/img/tantuni-wraps-cut.jpg' }
  };
  var FORMATS = {
    durum: { name: 'Dürüm wrap', add: 0 },
    plate: { name: 'Tantuni plate', add: 0 }
  };
  var FOODS = {
    gozleme: { name: 'Gözleme', sub: 'Feta cheese, cheese, parsley', price: 4.5, img: '/assets/img/gozleme.jpg' }
  };
  var DRINKS = {
    salgam: { name: 'Şalgam', sub: 'Turnib, spicy, 500ml', price: 1.5, img: '/assets/img/salgam.jpg' },
    'ayran-l': { name: 'Ayran', sub: 'Istanbul yoghurt drink', price: 1.5, img: '/assets/img/ayran-istanbul.jpg' },
    'ayran-s': { name: 'Ayran small', sub: 'Mis, 250ml', price: 1.5, img: '/assets/img/ayran-mis.jpg' },
    'fanta-o': { name: 'Fanta Orange', sub: '330ml can', price: 1.5, img: '/assets/img/fanta-orange.jpg' },
    'fanta-l': { name: 'Fanta Lemon', sub: '330ml can', price: 1.5, img: '/assets/img/fanta-lemon.jpg' },
    water: { name: 'Hayat Water', sub: 'Still mineral water, 500ml', price: 1.5, img: '/assets/img/hayat-water.jpg' }
  };
  // Items sold as a single card with an Add button: [card attribute, catalogue, basket key prefix]
  var CARDS = [['data-drink', DRINKS, 'drink']];
  var CATALOGUES = { food: FOODS, drink: DRINKS };
  var ASAP = "As soon as it's ready (about 15 minutes)";
  var STORE_KEY = 'mt_basket';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var gbp = function (n) { return '£' + n.toFixed(2); };

  var q = new URLSearchParams(location.search).get('meat');
  var state = {
    meat: MEATS[q] ? q : 'chicken',
    format: 'durum',
    spice: 'Medium',
    qty: 1,
    gqty: 1,
    basket: loadBasket(),
    step: 'basket'
  };

  // Image paths are looked up from the item key rather than trusted from storage,
  // so baskets saved by older versions of the site still show the right picture.
  function itemFor(key) {
    var parts = key.split('|');
    var cat = CATALOGUES[parts[0]];
    return cat ? cat[parts[1]] : MEATS[parts[0]];
  }
  function imgFor(key) {
    var item = itemFor(key);
    return item ? item.img : '';
  }
  function loadBasket() {
    try {
      var b = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      // Drop lines for items that are no longer on the menu (e.g. beef or lamb tantuni).
      return Array.isArray(b) ? b.filter(function (l) { return l && typeof l.key === 'string' && itemFor(l.key) && l.qty > 0 && typeof l.price === 'number'; }) : [];
    } catch (e) { return []; }
  }
  function save(basket) {
    state.basket = basket;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(basket)); } catch (e) {}
    render();
  }
  function addLine(line) {
    var b = state.basket.map(function (l) { return Object.assign({}, l); });
    var ex = b.find(function (l) { return l.key === line.key; });
    if (ex) ex.qty += line.qty; else b.push(line);
    save(b);
    bump();
  }
  function change(key, delta) {
    save(state.basket
      .map(function (l) { return l.key === key ? Object.assign({}, l, { qty: l.qty + delta }) : l; })
      .filter(function (l) { return l.qty > 0; }));
  }
  function count() { return state.basket.reduce(function (a, l) { return a + l.qty; }, 0); }
  function total() { return state.basket.reduce(function (a, l) { return a + l.qty * l.price; }, 0); }

  // Screen reader announcement for changes that have no visible message of their own
  var srTimer;
  function announce(msg) {
    var el = $('#sr-status');
    if (!el) return;
    el.textContent = '';
    clearTimeout(srTimer);
    srTimer = setTimeout(function () { el.textContent = msg; }, 50);
  }
  function summary() {
    var n = count();
    return 'Your order: ' + n + (n === 1 ? ' item, ' : ' items, ') + gbp(total()) + '.';
  }

  function bump() {
    var pill = $('#order-pill');
    pill.classList.remove('bump');
    void pill.offsetWidth;
    pill.classList.add('bump');
  }

  function setChecked(buttons, attr, value) {
    buttons.forEach(function (b) {
      var on = b.getAttribute(attr) === value;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
  }

  // ---------- Rendering ----------
  function render() {
    var meat = MEATS[state.meat], fmt = FORMATS[state.format];
    var unit = meat.price + fmt.add, n = count(), t = gbp(total());

    setChecked($$('[data-meat]'), 'data-meat', state.meat);
    setChecked($$('[data-format]'), 'data-format', state.format);
    setChecked($$('[data-spice]'), 'data-spice', state.spice);
    $('#qty').textContent = state.qty;
    $('#add-label').textContent = 'Add ' + state.qty + ' ' + meat.name.toLowerCase() + ' ' + fmt.name.toLowerCase() + (state.qty > 1 ? 's' : '') + ' to your order';
    $('#add-total').textContent = gbp(unit * state.qty);

    var gz = FOODS.gozleme;
    $('#gqty').textContent = state.gqty;
    $('#gozleme-label').textContent = 'Add ' + state.gqty + ' ' + gz.name.toLowerCase() + (state.gqty > 1 ? 's' : '') + ' to your order';
    $('#gozleme-total').textContent = gbp(gz.price * state.gqty);

    CARDS.forEach(function (c) {
      var attr = c[0], items = c[1], prefix = c[2];
      $$('[' + attr + ']').forEach(function (card) {
        var id = card.getAttribute(attr);
        var line = state.basket.find(function (l) { return l.key === prefix + '|' + id; });
        var qty = line ? line.qty : 0;
        var ctl = $('.ctl', card);
        var name = items[id].name;
        var html = qty > 0
          ? '<span class="drink-qty"><button type="button" data-drink-dec aria-label="Remove one ' + name + '">−</button><span>' + qty + '</span><button type="button" data-drink-inc aria-label="Add one more ' + name + '">+</button></span>'
          : '<button type="button" class="drink-add" data-drink-inc aria-label="Add ' + name + '">Add</button>';
        if (ctl.getAttribute('data-q') !== String(qty)) {
          // The buttons are rebuilt, so put focus back on the same one (or on "Add" if it went back to 0)
          var active = ctl.contains(document.activeElement) ? document.activeElement : null;
          var which = active && active.hasAttribute('data-drink-dec') ? '[data-drink-dec]' : '[data-drink-inc]';
          ctl.innerHTML = html;
          ctl.setAttribute('data-q', String(qty));
          if (active) { var f = $(which, ctl) || $('[data-drink-inc]', ctl); if (f) f.focus(); }
        }
      });
    });

    var list = $('#basket-lines');
    var focused = list.contains(document.activeElement) ? document.activeElement : null;
    var focusKey = focused && focused.closest('[data-key]').getAttribute('data-key');
    var focusAttr = focused && (focused.hasAttribute('data-line-inc') ? '[data-line-inc]' : '[data-line-dec]');
    list.innerHTML = '';
    state.basket.forEach(function (l) {
      var li = document.createElement('li');
      li.className = 'line';
      li.innerHTML =
        '<img alt="" width="52" height="52">' +
        '<div class="info"><span class="name"></span><span class="detail"></span>' +
        '<div class="qty"><button type="button" data-line-dec>−</button><span></span><button type="button" data-line-inc>+</button></div></div>' +
        '<span class="total"></span>';
      $('img', li).src = imgFor(l.key);
      $('.name', li).textContent = l.name;
      $('.detail', li).textContent = l.detail;
      $('.qty span', li).textContent = l.qty;
      $('.total', li).textContent = gbp(l.qty * l.price);
      $('[data-line-dec]', li).setAttribute('aria-label', 'Remove one ' + l.name);
      $('[data-line-inc]', li).setAttribute('aria-label', 'Add one more ' + l.name);
      li.setAttribute('data-key', l.key);
      list.appendChild(li);
      if (focusKey === l.key) { $(focusAttr, li).focus(); focusKey = null; }
    });
    // The line that had focus was removed: move focus to the basket heading instead of losing it
    if (focusKey && state.step === 'basket') $('#basket-title').focus();

    $('#basket-empty').hidden = n > 0;
    $('#checkout-btn').disabled = n === 0;
    $$('[data-count]').forEach(function (el) { el.textContent = n; });
    $$('[data-total]').forEach(function (el) { el.textContent = t; });

    $('#panel-basket').hidden = state.step !== 'basket';
    $('#panel-checkout').hidden = state.step !== 'checkout';
    $('#panel-done').hidden = state.step !== 'done';

    $('#order-bar').hidden = !(window.innerWidth < 980 && n > 0 && state.step === 'basket');
  }

  // ---------- Collection times ----------
  function fillTimes() {
    var sel = $('#time-select');
    var out = [ASAP];
    var d = new Date();
    d.setMinutes(Math.ceil((d.getMinutes() + 30) / 15) * 15, 0, 0);
    for (var i = 0; i < 12; i++) {
      out.push(d.toTimeString().slice(0, 5));
      d.setMinutes(d.getMinutes() + 15);
    }
    var current = sel.value;
    sel.innerHTML = '';
    out.forEach(function (t) {
      var o = document.createElement('option');
      o.value = o.textContent = t;
      sel.appendChild(o);
    });
    if (out.indexOf(current) >= 0) sel.value = current;
  }

  // ---------- Events ----------
  var flashTimer;
  function flash(msg, el) {
    var clear = function () { $$('.flash').forEach(function (f) { f.textContent = ''; }); };
    clear();
    (el || $('#flash')).textContent = msg;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(clear, 2600);
  }

  // Arrow-key navigation inside a radiogroup
  function radioKeys(buttons, pick) {
    buttons.forEach(function (b, i) {
      b.addEventListener('keydown', function (e) {
        var dir = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        var next = buttons[(i + dir + buttons.length) % buttons.length];
        pick(next);
        next.focus();
      });
    });
  }

  var meatBtns = $$('[data-meat]');
  var pickMeat = function (b) { state.meat = b.getAttribute('data-meat'); render(); };
  meatBtns.forEach(function (b) { b.addEventListener('click', function () { pickMeat(b); }); });
  radioKeys(meatBtns, pickMeat);

  var fmtBtns = $$('[data-format]');
  var pickFmt = function (b) { state.format = b.getAttribute('data-format'); render(); };
  fmtBtns.forEach(function (b) { b.addEventListener('click', function () { pickFmt(b); }); });
  radioKeys(fmtBtns, pickFmt);

  var spiceBtns = $$('[data-spice]');
  var pickSpice = function (b) { state.spice = b.getAttribute('data-spice'); render(); };
  spiceBtns.forEach(function (b) { b.addEventListener('click', function () { pickSpice(b); }); });
  radioKeys(spiceBtns, pickSpice);

  var track = $('#meat-track');
  $$('[data-scroll]').forEach(function (b) {
    b.addEventListener('click', function () {
      track.scrollBy({ left: Number(b.getAttribute('data-scroll')) * track.clientWidth * 0.8, behavior: 'smooth' });
    });
  });

  $$('[data-qty]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.qty = Math.min(20, Math.max(1, state.qty + Number(b.getAttribute('data-qty'))));
      render();
    });
  });

  $('#add-btn').addEventListener('click', function () {
    var meat = MEATS[state.meat], fmt = FORMATS[state.format];
    addLine({
      key: state.meat + '|' + state.format + '|' + state.spice,
      name: meat.name + ' tantuni',
      detail: fmt.name + ', ' + state.spice.toLowerCase() + ' chilli',
      price: meat.price + fmt.add,
      qty: state.qty
    });
    state.qty = 1;
    if (state.step === 'done') state.step = 'basket';
    render();
    flash('Added. Want a drink with that?');
  });

  $$('[data-gqty]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.gqty = Math.min(20, Math.max(1, state.gqty + Number(b.getAttribute('data-gqty'))));
      render();
    });
  });

  $('#gozleme-add').addEventListener('click', function () {
    var gz = FOODS.gozleme;
    addLine({ key: 'food|gozleme', name: gz.name, detail: gz.sub, price: gz.price, qty: state.gqty });
    state.gqty = 1;
    if (state.step === 'done') state.step = 'basket';
    render();
    flash('Added. Want a drink with that?', $('#gozleme-flash'));
  });

  CARDS.forEach(function (c) {
    var attr = c[0], items = c[1], prefix = c[2];
    $$('[' + attr + ']').forEach(function (card) {
      var id = card.getAttribute(attr), d = items[id];
      card.addEventListener('click', function (e) {
        if (e.target.closest('[data-drink-inc]')) {
          addLine({ key: prefix + '|' + id, name: d.name, detail: d.sub, price: d.price, qty: 1 });
          if (state.step === 'done') { state.step = 'basket'; render(); }
          announce('Added ' + d.name + '. ' + summary());
        } else if (e.target.closest('[data-drink-dec]')) {
          change(prefix + '|' + id, -1);
          announce('Removed one ' + d.name + '. ' + summary());
        }
      });
    });
  });

  $('#basket-lines').addEventListener('click', function (e) {
    var li = e.target.closest('[data-key]');
    if (!li) return;
    var key = li.getAttribute('data-key');
    var name = $('.name', li).textContent;
    if (e.target.closest('[data-line-inc]')) { change(key, 1); announce('Added one ' + name + '. ' + summary()); }
    else if (e.target.closest('[data-line-dec]')) { change(key, -1); announce('Removed one ' + name + '. ' + summary()); }
  });

  $('#checkout-btn').addEventListener('click', function () {
    if (!count()) return;
    fillTimes();
    state.step = 'checkout';
    render();
    var first = $('#panel-checkout input');
    if (first) first.focus();
  });
  $('#back-btn').addEventListener('click', function () { state.step = 'basket'; render(); $('#checkout-btn').focus(); });

  // Friendlier message than the browser default for a phone number that doesn't look right
  var phone = $('#f-phone');
  phone.addEventListener('input', function () { phone.setCustomValidity(''); });
  phone.addEventListener('invalid', function () {
    if (phone.validity.patternMismatch || phone.validity.tooShort) phone.setCustomValidity('Please enter a phone number we can call, like 07700 900123.');
  });

  $('#panel-checkout').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.currentTarget;
    placeOrder({
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      time: form.elements.time.value,
      notes: form.elements.notes.value.trim(),
      items: state.basket,
      total: total()
    });
  });

  // The one place an order leaves the page.
  // TODO: Stripe. Replace this with a call to a serverless function (e.g. /api/checkout)
  // that creates a Stripe Checkout Session from `order.items` and redirects to it.
  // Until then the order is only shown to the customer and is NOT sent to the shop.
  function placeOrder(order) {
    $('#done-name').textContent = order.name.split(' ')[0] || 'friend';
    $('#done-no').textContent = String(1000 + Math.floor(Math.random() * 9000));
    $('#done-time').textContent = order.time === ASAP ? 'in about 15 minutes' : 'at ' + order.time;
    $('#panel-checkout').reset();
    state.step = 'done';
    save([]);
    $('#basket').scrollIntoView({ block: 'start' });
    $('#done-title').focus({ preventScroll: true });
  }

  $('#new-order-btn').addEventListener('click', function () { state.step = 'basket'; render(); $('#basket-title').focus(); });

  window.addEventListener('resize', render);
  // Keep the basket in sync if it changes in another tab
  window.addEventListener('storage', function (e) { if (e.key === STORE_KEY) { state.basket = loadBasket(); render(); } });

  render();

  // Scroll the preselected meat (from ?meat=) into view in the carousel
  var idx = meatBtns.findIndex(function (b) { return b.getAttribute('data-meat') === state.meat; });
  if (idx > 0) track.scrollLeft = meatBtns[idx].offsetLeft - track.offsetLeft;
})();
