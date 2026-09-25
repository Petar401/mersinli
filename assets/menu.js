// Menu page: build a tantuni, order gözleme on its own, add drinks, keep a basket in localStorage,
// a draggable bottom-sheet basket on phones, and a preview checkout (cash now, card once Stripe is added).
// Works for both /menu (English) and /tr/menu (Turkish): the page language picks the strings.
(function () {
  'use strict';

  var LANG = /^tr/i.test(document.documentElement.lang) ? 'tr' : 'en';

  // Flip to true once Stripe Checkout is wired up in placeOrder() (see the TODO there).
  var PAYMENT_ONLINE_ENABLED = false;

  // Catalogue. Prices here are the source of truth for the basket (stored prices are ignored).
  var MEATS = {
    chicken: { name: { en: 'Chicken', tr: 'Tavuk' }, price: 6.5, img: '/assets/img/tantuni-plate-white-thumb.webp' },
    mix: { name: { en: 'Beef and lamb', tr: 'Karışık' }, price: 6.5, img: '/assets/img/tantuni-wraps-cut-thumb.webp' }
  };
  var FORMATS = {
    durum: { name: { en: 'Dürüm wrap', tr: 'Dürüm' }, plural: { en: 'dürüm wraps', tr: 'dürüm' }, add: 0 },
    plate: { name: { en: 'Tantuni plate', tr: 'Porsiyon' }, plural: { en: 'tantuni plates', tr: 'porsiyon' }, add: 0 }
  };
  var SPICE = { Mild: { en: 'mild chilli', tr: 'az acılı' }, Medium: { en: 'medium chilli', tr: 'orta acılı' }, Hot: { en: 'hot chilli', tr: 'acılı' } };
  var FOODS = {
    gozleme: { name: { en: 'Gözleme', tr: 'Gözleme' }, sub: { en: 'Feta cheese, cheese, parsley', tr: 'Beyaz peynir, kaşar, maydanoz' }, price: 4.5, img: '/assets/img/gozleme-thumb.webp' }
  };
  var DRINKS = {
    salgam: { name: { en: 'Şalgam', tr: 'Şalgam' }, sub: { en: 'Turnib, spicy, 500ml', tr: 'Turnib, acılı, 500 ml' }, price: 1.5, img: '/assets/img/salgam-thumb.webp' },
    'ayran-l': { name: { en: 'Ayran', tr: 'Ayran' }, sub: { en: 'Istanbul yoghurt drink', tr: 'İstanbul ayranı' }, price: 1.5, img: '/assets/img/ayran-istanbul-thumb.webp' },
    'ayran-s': { name: { en: 'Ayran small', tr: 'Küçük ayran' }, sub: { en: 'Mis, 250ml', tr: 'Mis, 250 ml' }, price: 1.5, img: '/assets/img/ayran-mis-thumb.webp' },
    'fanta-o': { name: { en: 'Fanta Orange', tr: 'Fanta Portakal' }, sub: { en: '330ml can', tr: '330 ml kutu' }, price: 1.5, img: '/assets/img/fanta-orange-thumb.webp' },
    'fanta-l': { name: { en: 'Fanta Lemon', tr: 'Fanta Limon' }, sub: { en: '330ml can', tr: '330 ml kutu' }, price: 1.5, img: '/assets/img/fanta-lemon-thumb.webp' },
    water: { name: { en: 'Hayat Water', tr: 'Hayat Su' }, sub: { en: 'Still mineral water, 500ml', tr: 'Doğal kaynak suyu, 500 ml' }, price: 1.5, img: '/assets/img/hayat-water-thumb.webp' }
  };
  var CATALOGUES = { food: FOODS, drink: DRINKS };
  var STORE_KEY = 'mt_basket';

  var S = {
    en: {
      addTantuni: function (n, meat, fmt) { return 'Add ' + n + ' ' + meat.toLowerCase() + ' ' + fmt + ' to your order'; },
      addGozleme: function (n) { return 'Add ' + n + ' gözleme' + (n > 1 ? 's' : '') + ' to your order'; },
      tantuni: function (meat) { return meat + ' tantuni'; },
      added: 'Added. Want a drink with that?',
      add: 'Add', addA: function (x) { return 'Add ' + x; }, addOne: function (x) { return 'Add one more ' + x; }, removeOne: function (x) { return 'Remove one ' + x; },
      addedX: function (x) { return 'Added ' + x + '. '; }, removedX: function (x) { return 'Removed one ' + x + '. '; }, addedOne: function (x) { return 'Added one ' + x + '. '; },
      summary: function (n, t) { return 'Your order: ' + n + (n === 1 ? ' item, ' : ' items, ') + t + '.'; },
      asap: "As soon as it's ready (about 15 minutes)",
      soon: 'in about 15 minutes', at: function (t) { return 'at ' + t; },
      beforeOpen: 'We open at 10am. Pick a collection time from 10:15.',
      closed: "We're closed for today. Online orders open again at 10am, or pop in tomorrow.",
      phone: 'Please enter a phone number we can call, like 07700 900123.',
      payCash: 'Place order, pay cash when you collect',
      payCard: 'Continue to secure card payment',
      paidBy: { cash: 'Pay with cash when you collect.', card: 'Paid online by card.' },
      friend: 'friend',
      openSheet: 'Your order', closeSheet: 'Close your order'
    },
    tr: {
      addTantuni: function (n, meat, fmt) { return 'Siparişe ' + n + ' ' + meat.toLocaleLowerCase('tr') + ' ' + fmt + ' ekle'; },
      addGozleme: function (n) { return 'Siparişe ' + n + ' gözleme ekle'; },
      tantuni: function (meat) { return meat + ' tantuni'; },
      added: 'Eklendi. Yanına bir içecek?',
      add: 'Ekle', addA: function (x) { return x + ' ekle'; }, addOne: function (x) { return 'Bir ' + x + ' daha ekle'; }, removeOne: function (x) { return 'Bir ' + x + ' çıkar'; },
      addedX: function (x) { return x + ' eklendi. '; }, removedX: function (x) { return 'Bir ' + x + ' çıkarıldı. '; }, addedOne: function (x) { return 'Bir ' + x + ' eklendi. '; },
      summary: function (n, t) { return 'Siparişiniz: ' + n + ' ürün, ' + t + '.'; },
      asap: 'Hazır olur olmaz (yaklaşık 15 dakika)',
      soon: 'yaklaşık 15 dakika içinde', at: function (t) { return 'saat ' + t; },
      beforeOpen: 'Saat 10:00’da açılıyoruz. 10:15 ve sonrası için bir teslim alma saati seçin.',
      closed: 'Bugün için kapandık. Online siparişler yarın saat 10:00’da yeniden açılıyor.',
      phone: 'Lütfen size ulaşabileceğimiz bir telefon numarası girin, örneğin 07700 900123.',
      payCash: 'Siparişi ver, teslim alırken nakit öde',
      payCard: 'Güvenli kartla ödemeye geç',
      paidBy: { cash: 'Teslim alırken nakit ödeyin.', card: 'Online kartla ödendi.' },
      friend: 'dostum',
      openSheet: 'Siparişiniz', closeSheet: 'Siparişi kapat'
    }
  }[LANG];

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var gbp = function (n) { var s = '£' + n.toFixed(2); return LANG === 'tr' ? s.replace('.', ',') : s; };
  var t = function (o) { return o[LANG] || o.en; };

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

  // ---------- Basket lines are described from their key, in the page's language ----------
  // Keys: "chicken|durum|Medium" (tantuni), "food|gozleme", "drink|salgam"
  function describe(key) {
    var p = key.split('|');
    var cat = CATALOGUES[p[0]];
    if (cat) {
      var item = cat[p[1]];
      return item && { name: t(item.name), detail: t(item.sub), price: item.price, img: item.img };
    }
    var meat = MEATS[p[0]], fmt = FORMATS[p[1]] || FORMATS.durum, spice = SPICE[p[2]] || SPICE.Medium;
    return meat && { name: S.tantuni(t(meat.name)), detail: t(fmt.name) + ', ' + t(spice), price: meat.price + fmt.add, img: meat.img };
  }
  function loadBasket() {
    try {
      var b = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      // Drop lines for items that are no longer on the menu, and anything malformed
      return Array.isArray(b) ? b.filter(function (l) { return l && typeof l.key === 'string' && describe(l.key) && l.qty > 0; })
        .map(function (l) { return { key: l.key, qty: Math.min(99, Math.floor(l.qty)) }; }) : [];
    } catch (e) { return []; }
  }
  function save(basket) {
    state.basket = basket;
    try {
      // name/detail/price are kept for older versions of the site open in another tab
      localStorage.setItem(STORE_KEY, JSON.stringify(basket.map(function (l) {
        var d = describe(l.key);
        return { key: l.key, qty: l.qty, name: d.name, detail: d.detail, price: d.price };
      })));
    } catch (e) {}
    render();
  }
  function addLine(key, qty) {
    var b = state.basket.map(function (l) { return { key: l.key, qty: l.qty }; });
    var ex = b.find(function (l) { return l.key === key; });
    if (ex) ex.qty += qty; else b.push({ key: key, qty: qty });
    save(b);
    bump();
  }
  function change(key, delta) {
    save(state.basket
      .map(function (l) { return l.key === key ? { key: l.key, qty: l.qty + delta } : l; })
      .filter(function (l) { return l.qty > 0; }));
  }
  function count() { return state.basket.reduce(function (a, l) { return a + l.qty; }, 0); }
  function total() { return state.basket.reduce(function (a, l) { return a + l.qty * describe(l.key).price; }, 0); }

  // Screen reader announcement for changes that have no visible message of their own
  var srTimer;
  function announce(msg) {
    var el = $('#sr-status');
    if (!el) return;
    el.textContent = '';
    clearTimeout(srTimer);
    srTimer = setTimeout(function () { el.textContent = msg; }, 50);
  }
  function summary() { return S.summary(count(), gbp(total())); }

  // One small, meaningful confirmation: the count pops, and phones that support it give a tiny tick
  function bump() {
    [$('#order-pill'), $('#order-bar')].forEach(function (el) {
      if (!el) return;
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    });
    if (navigator.vibrate && !(window.MT && window.MT.reduceMotion && window.MT.reduceMotion.matches)) {
      try { navigator.vibrate(8); } catch (e) {}
    }
  }

  function setChecked(buttons, attr, value) {
    buttons.forEach(function (b) {
      var on = b.getAttribute(attr) === value;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
  }

  // ---------- Rendering ----------
  var small = window.matchMedia('(max-width: 979px)');

  function render() {
    var meat = MEATS[state.meat], fmt = FORMATS[state.format];
    var unit = meat.price + fmt.add, n = count(), tot = gbp(total());

    setChecked($$('[data-meat]'), 'data-meat', state.meat);
    setChecked($$('[data-format]'), 'data-format', state.format);
    setChecked($$('[data-spice]'), 'data-spice', state.spice);
    $('#qty').textContent = state.qty;
    $('#add-label').textContent = S.addTantuni(state.qty, t(meat.name), state.qty > 1 ? t(fmt.plural) : t(fmt.name).toLocaleLowerCase(LANG));
    $('#add-total').textContent = gbp(unit * state.qty);

    var gz = FOODS.gozleme;
    $('#gqty').textContent = state.gqty;
    $('#gozleme-label').textContent = S.addGozleme(state.gqty);
    $('#gozleme-total').textContent = gbp(gz.price * state.gqty);

    $$('[data-drink]').forEach(function (card) {
      var id = card.getAttribute('data-drink');
      var line = state.basket.find(function (l) { return l.key === 'drink|' + id; });
      var qty = line ? line.qty : 0;
      var ctl = $('.ctl', card);
      var name = t(DRINKS[id].name);
      if (ctl.getAttribute('data-q') === String(qty)) return;
      // The buttons are rebuilt, so put focus back on the same one (or on "Add" if it went back to 0)
      var active = ctl.contains(document.activeElement) ? document.activeElement : null;
      var which = active && active.hasAttribute('data-drink-dec') ? '[data-drink-dec]' : '[data-drink-inc]';
      ctl.innerHTML = qty > 0
        ? '<span class="drink-qty"><button type="button" data-drink-dec></button><span></span><button type="button" data-drink-inc>+</button></span>'
        : '<button type="button" class="drink-add" data-drink-inc></button>';
      if (qty > 0) {
        $('[data-drink-dec]', ctl).textContent = '−';
        $('[data-drink-dec]', ctl).setAttribute('aria-label', S.removeOne(name));
        $('[data-drink-inc]', ctl).setAttribute('aria-label', S.addOne(name));
        $('.drink-qty > span', ctl).textContent = qty;
      } else {
        $('[data-drink-inc]', ctl).textContent = S.add;
        $('[data-drink-inc]', ctl).setAttribute('aria-label', S.addA(name));
      }
      ctl.setAttribute('data-q', String(qty));
      if (active) { var f = $(which, ctl) || $('[data-drink-inc]', ctl); if (f) f.focus(); }
    });

    var list = $('#basket-lines');
    var focused = list.contains(document.activeElement) ? document.activeElement : null;
    var focusKey = focused && focused.closest('[data-key]') && focused.closest('[data-key]').getAttribute('data-key');
    var focusAttr = focused && (focused.hasAttribute('data-line-inc') ? '[data-line-inc]' : '[data-line-dec]');
    list.innerHTML = '';
    state.basket.forEach(function (l) {
      var d = describe(l.key);
      var li = document.createElement('li');
      li.className = 'line';
      li.innerHTML =
        '<img alt="" width="52" height="52" decoding="async">' +
        '<div class="info"><span class="name"></span><span class="detail"></span>' +
        '<div class="qty"><button type="button" data-line-dec>−</button><span></span><button type="button" data-line-inc>+</button></div></div>' +
        '<span class="total"></span>';
      $('img', li).src = d.img;
      $('.name', li).textContent = d.name;
      $('.detail', li).textContent = d.detail;
      $('.qty span', li).textContent = l.qty;
      $('.total', li).textContent = gbp(l.qty * d.price);
      $('[data-line-dec]', li).setAttribute('aria-label', S.removeOne(d.name));
      $('[data-line-inc]', li).setAttribute('aria-label', S.addOne(d.name));
      li.setAttribute('data-key', l.key);
      list.appendChild(li);
      if (focusKey === l.key) { $(focusAttr, li).focus(); focusKey = null; }
    });
    // The line that had focus was removed: move focus to the basket heading instead of losing it
    if (focusKey && state.step === 'basket') $('#basket-title').focus();

    $('#basket-empty').hidden = n > 0;
    $('#checkout-btn').disabled = n === 0;
    $$('[data-count]').forEach(function (el) { el.textContent = n; });
    $$('[data-total]').forEach(function (el) { el.textContent = tot; });

    $('#panel-basket').hidden = state.step !== 'basket';
    $('#panel-checkout').hidden = state.step !== 'checkout';
    $('#panel-done').hidden = state.step !== 'done';

    $('#order-bar').hidden = !(small.matches && n > 0 && !sheet.open);
  }

  // ---------- Collection times, in UK time, inside opening hours ----------
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  function fillTimes() {
    var sel = $('#time-select');
    var note = $('#time-note');
    var submit = $('#submit-btn');
    var MT = window.MT;
    var now = MT ? MT.londonNow() : { day: new Date().getDay(), hour: new Date().getHours(), minute: new Date().getMinutes() };
    var openMin = (MT ? MT.openHour : 10) * 60;
    var closeMin = (MT ? MT.closeHour(now.day) : 22) * 60;
    var nowMin = now.hour * 60 + now.minute;
    var out = [];
    var noteText = '';

    // Last collection slot is 15 minutes before closing
    var last = closeMin - 15;
    var first;
    if (nowMin < openMin) {
      first = openMin + 15;
      noteText = S.beforeOpen;
    } else {
      if (nowMin + 15 <= last) out.push({ v: 'asap', l: S.asap });
      first = Math.ceil((nowMin + 30) / 15) * 15;
    }
    for (var m = first, i = 0; m <= last && i < 16; m += 15, i++) {
      var hhmm = pad(Math.floor(m / 60)) + ':' + pad(m % 60);
      out.push({ v: hhmm, l: hhmm });
    }
    if (!out.length) noteText = S.closed;

    var current = sel.value;
    sel.innerHTML = '';
    out.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o.v;
      opt.textContent = o.l;
      sel.appendChild(opt);
    });
    if (out.some(function (o) { return o.v === current; })) sel.value = current;
    sel.disabled = !out.length;
    submit.disabled = !out.length;
    note.textContent = noteText;
    note.hidden = !noteText;
  }

  // ---------- Payment choice ----------
  function syncPayment() {
    var form = $('#panel-checkout');
    var card = form.elements.payment && form.querySelector('input[name="payment"][value="card"]');
    if (card) {
      card.disabled = !PAYMENT_ONLINE_ENABLED;
      card.closest('.seg').classList.toggle('is-disabled', !PAYMENT_ONLINE_ENABLED);
    }
    var chosen = form.querySelector('input[name="payment"]:checked');
    $('#submit-label').textContent = chosen && chosen.value === 'card' ? S.payCard : S.payCash;
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
    addLine(state.meat + '|' + state.format + '|' + state.spice, state.qty);
    state.qty = 1;
    if (state.step === 'done') state.step = 'basket';
    render();
    flash(S.added);
  });

  $$('[data-gqty]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.gqty = Math.min(20, Math.max(1, state.gqty + Number(b.getAttribute('data-gqty'))));
      render();
    });
  });

  $('#gozleme-add').addEventListener('click', function () {
    addLine('food|gozleme', state.gqty);
    state.gqty = 1;
    if (state.step === 'done') state.step = 'basket';
    render();
    flash(S.added, $('#gozleme-flash'));
  });

  $$('[data-drink]').forEach(function (card) {
    var id = card.getAttribute('data-drink'), name = t(DRINKS[id].name);
    card.addEventListener('click', function (e) {
      if (e.target.closest('[data-drink-inc]')) {
        addLine('drink|' + id, 1);
        if (state.step === 'done') { state.step = 'basket'; render(); }
        announce(S.addedX(name) + summary());
      } else if (e.target.closest('[data-drink-dec]')) {
        change('drink|' + id, -1);
        announce(S.removedX(name) + summary());
      }
    });
  });

  $('#basket-lines').addEventListener('click', function (e) {
    var li = e.target.closest('[data-key]');
    if (!li) return;
    var key = li.getAttribute('data-key');
    var name = describe(key).name;
    if (e.target.closest('[data-line-inc]')) { change(key, 1); announce(S.addedOne(name) + summary()); }
    else if (e.target.closest('[data-line-dec]')) { change(key, -1); announce(S.removedX(name) + summary()); }
  });

  $('#checkout-btn').addEventListener('click', function () {
    if (!count()) return;
    fillTimes();
    syncPayment();
    state.step = 'checkout';
    render();
    var first = $('#panel-checkout input[type="text"]');
    if (first) first.focus({ preventScroll: small.matches });
  });
  $('#back-btn').addEventListener('click', function () { state.step = 'basket'; render(); $('#checkout-btn').focus(); });
  $('#panel-checkout').addEventListener('change', function (e) { if (e.target.name === 'payment') syncPayment(); });

  // Friendlier message than the browser default for a phone number that doesn't look right
  var phone = $('#f-phone');
  phone.addEventListener('input', function () { phone.setCustomValidity(''); });
  phone.addEventListener('invalid', function () {
    if (phone.validity.patternMismatch || phone.validity.tooShort) phone.setCustomValidity(S.phone);
  });

  $('#panel-checkout').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.currentTarget;
    var payment = form.querySelector('input[name="payment"]:checked');
    placeOrder({
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      time: form.elements.time.value,
      notes: form.elements.notes.value.trim(),
      payment: payment ? payment.value : 'cash',
      lang: LANG,
      items: state.basket.map(function (l) { var d = describe(l.key); return { key: l.key, qty: l.qty, name: d.name, detail: d.detail, price: d.price }; }),
      total: total()
    });
  });

  // The one place an order leaves the page.
  // TODO (next week):
  //  1. Telegram: POST the order to a Vercel serverless function (e.g. /api/order) that re-prices the
  //     items from the same catalogue on the server, then sends the order to the shop's Telegram chat.
  //  2. Stripe: when order.payment === 'card', that function creates a Stripe Checkout Session and
  //     returns its URL; redirect with location.assign(url). Then set PAYMENT_ONLINE_ENABLED = true
  //     and add Stripe's domains to the Content-Security-Policy in vercel.json (see README).
  // Until then the order is only shown to the customer and is NOT sent to the shop.
  function placeOrder(order) {
    $('#done-name').textContent = order.name.split(' ')[0] || S.friend;
    $('#done-no').textContent = String(1000 + Math.floor(Math.random() * 9000));
    $('#done-time').textContent = order.time === 'asap' ? S.soon : S.at(order.time);
    $('#done-pay').textContent = S.paidBy[order.payment] || '';
    $('#panel-checkout').reset();
    state.step = 'done';
    save([]);
    if (!sheet.open) $('#basket').scrollIntoView({ block: 'start' });
    $('#done-title').focus({ preventScroll: true });
  }

  $('#new-order-btn').addEventListener('click', function () { state.step = 'basket'; render(); $('#basket-title').focus(); });

  // =====================================================================================
  // Bottom sheet (phones and small tablets)
  // The basket slides up from the order bar and follows the finger 1:1. On release it keeps the
  // finger's velocity, projects where the flick is heading, and a spring carries it to the nearest
  // resting point. It can be grabbed again mid-flight: every animation starts from where it is now.
  // =====================================================================================
  var basket = $('#basket');
  var grab = $('.sheet-grab', basket);
  var scrim = document.createElement('div');
  scrim.className = 'sheet-scrim';
  scrim.setAttribute('aria-hidden', 'true');
  document.body.appendChild(scrim);

  var sheet = { open: false, y: 0, v: 0, h: 0, raf: 0, dragging: false, opener: null };
  var inertTargets = [$('.site-header'), $('.menu-main'), $('.site-footer'), $('#order-bar')].filter(Boolean);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function sheetHeight() { return basket.getBoundingClientRect().height || window.innerHeight * 0.8; }
  function paint(y) {
    sheet.y = y;
    basket.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0)';
    var p = sheet.h ? Math.max(0, Math.min(1, 1 - y / sheet.h)) : 0;
    scrim.style.opacity = String(p);
  }

  // Apple's projection: where a flick would come to rest under normal scroll deceleration
  function project(v, rate) { rate = rate || 0.998; return (v / 1000) * rate / (1 - rate); }
  // Soft boundary: the further past the edge, the less the sheet follows
  function rubberband(over, dim, c) { c = c || 0.55; return (over * dim * c) / (dim + c * Math.abs(over)); }

  // Spring with Apple's designer parameters: damping ratio (1 = no overshoot) and response (seconds)
  function springTo(target, opts, done) {
    cancelAnimationFrame(sheet.raf);
    if (reduce.matches) { paint(target); sheet.v = 0; if (done) done(); return; }
    var zeta = opts.damping, response = opts.response;
    var k = Math.pow(2 * Math.PI / response, 2), c = 4 * Math.PI * zeta / response;
    var last = performance.now();
    (function step(now) {
      var dt = Math.min(0.064, (now - last) / 1000); last = now;
      // Semi-implicit Euler in small sub-steps keeps it stable at any frame rate
      for (var i = 0, n = 4, h = dt / n; i < n; i++) {
        var a = -k * (sheet.y - target) - c * sheet.v;
        sheet.v += a * h;
        sheet.y += sheet.v * h;
      }
      paint(sheet.y);
      if (Math.abs(sheet.v) < 4 && Math.abs(sheet.y - target) < 0.5) { paint(target); sheet.v = 0; if (done) done(); return; }
      sheet.raf = requestAnimationFrame(step);
    })(last);
  }

  function setInert(on) {
    inertTargets.forEach(function (el) { if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
  }

  function openSheet(opener, velocity) {
    if (!small.matches) return;
    sheet.opener = opener || document.activeElement;
    var wasOpen = sheet.open;
    sheet.open = true;
    var fromClosed = !document.documentElement.classList.contains('sheet-open');
    if (fromClosed) { sheet.v = velocity || 0; paint(sheet.h = sheetHeight()); }
    document.documentElement.classList.add('sheet-open');
    basket.removeAttribute('inert');
    basket.setAttribute('aria-hidden', 'false');
    sheet.h = sheetHeight();
    setInert(true);
    render();
    springTo(0, { damping: Math.abs(sheet.v) > 400 ? 0.86 : 1, response: 0.38 });
    if (!wasOpen) $('#basket-title').focus({ preventScroll: true });
  }

  function closeSheet(returnFocus, velocity) {
    if (!sheet.open) return;
    sheet.open = false;
    if (velocity != null) sheet.v = velocity;
    setInert(false);
    render();
    springTo(sheet.h || sheetHeight(), { damping: 1, response: 0.34 }, function () {
      if (sheet.open) return; // grabbed and reopened on the way down
      document.documentElement.classList.remove('sheet-open');
      basket.setAttribute('inert', '');
      basket.setAttribute('aria-hidden', 'true');
    });
    if (returnFocus !== false) {
      // Back to whatever opened the sheet; if that has gone (the bar hides once the order is placed), the header pill
      var back = [sheet.opener, $('#order-bar'), $('#order-pill')].find(function (el) {
        return el && document.contains(el) && !el.hidden && el.getClientRects().length;
      });
      if (back) back.focus({ preventScroll: true });
    }
  }

  function enterSheetMode() {
    document.documentElement.classList.add('sheet-mode');
    basket.setAttribute('role', 'dialog');
    basket.setAttribute('aria-modal', 'true');
    if (!sheet.open) {
      basket.setAttribute('inert', '');
      basket.setAttribute('aria-hidden', 'true');
      sheet.h = sheetHeight();
      paint(sheet.h);
    }
  }
  function leaveSheetMode() {
    cancelAnimationFrame(sheet.raf);
    sheet.open = false;
    setInert(false);
    ['role', 'aria-modal', 'inert', 'aria-hidden'].forEach(function (a) { basket.removeAttribute(a); });
    basket.style.transform = '';
    scrim.style.opacity = '';
    document.documentElement.classList.remove('sheet-mode', 'sheet-open');
  }
  function onMode() { if (small.matches) enterSheetMode(); else leaveSheetMode(); render(); }
  if (small.addEventListener) small.addEventListener('change', onMode); else if (small.addListener) small.addListener(onMode);

  // Links to #basket (the order bar and the header pill) open the sheet instead of jumping
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href="#basket"]');
    if (a && small.matches) { e.preventDefault(); openSheet(a); return; }
    // An in-page link inside the sheet (e.g. to the allergen table): close, then let it navigate
    var inner = e.target.closest('#basket a[href^="#"]');
    if (inner && sheet.open) closeSheet(false);
  });
  $$('[data-sheet-close]').forEach(function (b) { b.addEventListener('click', function () { closeSheet(); }); });
  scrim.addEventListener('click', function () { closeSheet(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet.open) closeSheet(); });

  // ---------- Dragging ----------
  var drag = null;
  grab.addEventListener('pointerdown', function (e) {
    if (!small.matches || !sheet.open || e.button > 0) return;
    if (e.target.closest('button:not(.sheet-handle), a, input, select, textarea')) return;
    cancelAnimationFrame(sheet.raf); // grab it mid-flight: carry on from where it is now
    sheet.h = sheetHeight();
    drag = { id: e.pointerId, startY: e.clientY, startSheetY: sheet.y, active: false, hist: [{ y: e.clientY, t: e.timeStamp }] };
    grab.setPointerCapture(e.pointerId);
  });
  grab.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dy = e.clientY - drag.startY;
    // A little hysteresis so a tap on the handle isn't read as a drag
    if (!drag.active && Math.abs(dy) < 6) return;
    drag.active = true;
    sheet.dragging = true;
    var y = drag.startSheetY + dy;
    if (y < 0) y = -rubberband(-y, sheet.h);
    paint(y);
    drag.hist.push({ y: e.clientY, t: e.timeStamp });
    if (drag.hist.length > 6) drag.hist.shift();
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var wasActive = drag.active, hist = drag.hist;
    drag = null;
    sheet.dragging = false;
    if (wasActive) sheet.dragEnd = performance.now();
    if (!wasActive) return;
    // Release velocity from the last ~100ms of movement
    var a = hist[0], b = hist[hist.length - 1];
    for (var i = hist.length - 1; i >= 0; i--) { if (b.t - hist[i].t > 100) break; a = hist[i]; }
    var v = b.t > a.t ? (b.y - a.y) / ((b.t - a.t) / 1000) : 0;
    sheet.v = v;
    var projected = sheet.y + project(v);
    if (projected > sheet.h * 0.5) closeSheet(true, v);
    else springTo(0, { damping: Math.abs(v) > 400 ? 0.82 : 1, response: 0.36 });
  }
  grab.addEventListener('pointerup', endDrag);
  grab.addEventListener('pointercancel', endDrag);
  // Keyboard users: the handle is a button that closes the sheet
  var handle = $('.sheet-handle', basket);
  if (handle) handle.addEventListener('click', function () {
    // The click that ends a drag isn't a tap on the handle
    if (sheet.dragEnd && performance.now() - sheet.dragEnd < 350) return;
    closeSheet();
  });

  window.addEventListener('resize', function () {
    if (!small.matches) return;
    sheet.h = sheetHeight();
    if (!sheet.open) paint(sheet.h);
  }, { passive: true });

  // Keep the basket in sync if it changes in another tab
  window.addEventListener('storage', function (e) { if (e.key === STORE_KEY) { state.basket = loadBasket(); render(); } });

  if (small.matches) enterSheetMode();
  render();

  // Scroll the preselected meat (from ?meat=) into view in the carousel
  var idx = meatBtns.findIndex(function (b) { return b.getAttribute('data-meat') === state.meat; });
  if (idx > 0) track.scrollLeft = meatBtns[idx].offsetLeft - track.offsetLeft;
})();
