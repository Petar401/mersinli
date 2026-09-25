// Shared on every page: header material, mobile menu, cookie choices, click-to-load map,
// "open now" badge, scroll reveals, mobile order pill, guide contents highlight, Vercel Analytics.
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var TR = /^tr/i.test(document.documentElement.lang);
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ---------- Opening hours, in UK time. Shared with menu.js through window.MT ----------
  // 10:00–22:00 Sunday to Thursday, 10:00–23:00 Friday and Saturday
  var OPEN_HOUR = 10;
  function closeHour(day) { return day === 5 || day === 6 ? 23 : 22; }
  var DAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  function londonNow(date) {
    var parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
    }).formatToParts(date || new Date());
    var get = function (type) { var p = parts.find(function (x) { return x.type === type; }); return p ? p.value : ''; };
    return { day: DAYS[get('weekday').slice(0, 3)], hour: parseInt(get('hour'), 10), minute: parseInt(get('minute'), 10) };
  }
  function isOpen(now) { return now.hour >= OPEN_HOUR && now.hour < closeHour(now.day); }
  window.MT = { londonNow: londonNow, isOpen: isOpen, openHour: OPEN_HOUR, closeHour: closeHour, lang: TR ? 'tr' : 'en' };

  // ---------- Header: soft edge shadow only once content scrolls underneath ----------
  var header = $('.site-header');
  if (header && 'IntersectionObserver' in window) {
    var sentinel = document.createElement('div');
    sentinel.className = 'header-sentinel';
    sentinel.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(sentinel, document.body.firstChild);
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) header.removeAttribute('data-scrolled');
      else header.setAttribute('data-scrolled', '');
    }, { rootMargin: '8px 0px 0px 0px' }).observe(sentinel);
  }

  // ---------- Mobile menu ----------
  var toggle = $('.nav-toggle');
  var menu = toggle && document.getElementById(toggle.getAttribute('aria-controls'));
  // Must match the breakpoint in site.css
  var desktop = window.matchMedia('(min-width: 1025px)');

  function setMenu(open, returnFocus) {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) header.setAttribute('data-menu-open', '');
    else header.removeAttribute('data-menu-open');
    if (open) { var first = $('a', menu); if (first) first.focus({ preventScroll: true }); }
    else if (returnFocus) toggle.focus();
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.hasAttribute('data-menu-open')) setMenu(false, true);
    });
    document.addEventListener('click', function (e) {
      if (header.hasAttribute('data-menu-open') && !header.contains(e.target)) setMenu(false);
    });
    // Close the panel when focus leaves the header (e.g. tabbing past the last link)
    header.addEventListener('focusout', function (e) {
      if (header.hasAttribute('data-menu-open') && e.relatedTarget && !header.contains(e.relatedTarget)) setMenu(false);
    });
    var onBreakpoint = function () { if (desktop.matches) setMenu(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onBreakpoint);
    else if (desktop.addListener) desktop.addListener(onBreakpoint);
  }

  // ---------- "Open now" badge. Its space is reserved in CSS, so filling it in doesn't move anything ----------
  var badges = $$('[data-open-now]');
  if (badges.length) {
    try {
      var now = londonNow();
      var open = isOpen(now);
      var close = closeHour(now.day);
      var text;
      if (TR) text = open ? 'Şu an açık, ' + close + ':00’' + (close === 23 ? 'e' : 'ye') + ' kadar' : 'Şu an kapalı, 10:00’da açılıyor';
      else text = open ? 'Open now, until ' + (close - 12) + 'pm' : 'Closed now, opens at 10am';
      badges.forEach(function (el) {
        el.textContent = text;
        el.classList.toggle('is-open', open);
        el.removeAttribute('data-pending');
        el.hidden = false;
      });
    } catch (e) {
      badges.forEach(function (el) { el.hidden = true; });
    }
  }

  // ---------- Scroll reveals: fade and rise once, as a section comes into view ----------
  var reveals = $$('[data-reveal]');
  if (reveals.length) {
    if (!('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      reveals.forEach(function (el) {
        // Anything already on screen at load shows straight away, without animating in
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
        else io.observe(el);
      });
    }
  }

  // ---------- Mobile order pill: appears once the page's main order button scrolls away ----------
  var cta = $('.mobile-cta');
  var watch = $('[data-cta-watch]');
  if (cta && watch && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('has-mobile-cta');
    var footer = $('.site-footer');
    var watchVisible = true, footerVisible = false;
    var sync = function () {
      var show = !watchVisible && !footerVisible;
      if (show) { cta.setAttribute('data-show', ''); cta.removeAttribute('inert'); }
      else { cta.removeAttribute('data-show'); cta.setAttribute('inert', ''); }
    };
    cta.setAttribute('inert', '');
    new IntersectionObserver(function (e) { watchVisible = e[0].isIntersecting || e[0].boundingClientRect.top > 0; sync(); }).observe(watch);
    if (footer) new IntersectionObserver(function (e) { footerVisible = e[0].isIntersecting; sync(); }).observe(footer);
  }

  // ---------- Guide pages: highlight the section being read in the contents list ----------
  var tocLinks = $$('.toc a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    tocLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var headings = Object.keys(byId).map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var tocIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        tocLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
        byId[entry.target.id].setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    headings.forEach(function (h) { tocIO.observe(h); });
  }

  // ---------- Cookie choices ----------
  // Only Google Maps sets cookies. The basket (localStorage) is strictly necessary and needs no consent.
  var CONSENT_KEY = 'mt_consent';
  function getConsent() { try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem(CONSENT_KEY, v); } catch (e) {} }

  var COPY = TR ? {
    title: 'Çerezler',
    body: 'Sipariş sepetinizi bu cihazda saklıyoruz, böylece geri döndüğünüzde hâlâ orada olur. Takip veya reklam çerezi kullanmıyoruz. ' +
      'Haritamız Google’dan gelir ve kendi çerezlerini kullanır, bu yüzden yalnızca siz izin verirseniz yüklüyoruz. <a href="/tr/gizlilik">Gizlilik ve çerezler</a>',
    maps: 'Google Haritalar’a izin ver',
    essential: 'Yalnızca gerekli olanlar'
  } : {
    title: 'Cookies',
    body: 'We keep your order basket on this device so it is still there when you come back. We don\'t use tracking or advertising cookies. ' +
      'Our map comes from Google, which sets its own cookies, so we only load it if you say yes. <a href="/privacy">Privacy and cookies</a>',
    maps: 'Allow Google Maps',
    essential: 'Essential only'
  };

  var banner, bannerReturn;
  function buildBanner() {
    banner = document.createElement('section');
    banner.className = 'cookie-banner';
    banner.setAttribute('aria-labelledby', 'cookie-title');
    banner.innerHTML =
      '<h2 id="cookie-title" tabindex="-1">' + COPY.title + '</h2>' +
      '<p>' + COPY.body + '</p>' +
      '<div class="cookie-actions">' +
      '<button type="button" class="btn btn-red" data-consent="maps">' + COPY.maps + '</button>' +
      '<button type="button" class="btn btn-outline" data-consent="essential">' + COPY.essential + '</button>' +
      '</div>';
    banner.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]');
      if (!b) return;
      var v = b.getAttribute('data-consent');
      setConsent(v);
      hideBanner();
      if (v === 'maps') loadMaps(); else unloadMaps();
    });
    document.body.appendChild(banner);
  }
  function showBanner(focus) {
    if (!banner) buildBanner();
    banner.hidden = false;
    document.documentElement.classList.add('cookie-open');
    if (focus) $('#cookie-title', banner).focus();
  }
  function hideBanner() {
    banner.hidden = true;
    document.documentElement.classList.remove('cookie-open');
    if (bannerReturn) { bannerReturn.focus(); bannerReturn = null; }
  }
  $$('[data-cookie-settings]').forEach(function (b) {
    b.addEventListener('click', function () { bannerReturn = b; showBanner(true); });
  });

  // ---------- Click-to-load Google map ----------
  var facades = $$('[data-map-src]');
  facades.forEach(function (f) { f._facade = f.innerHTML; });
  function loadMap(f) {
    if (f.hasAttribute('data-loaded')) return;
    var iframe = document.createElement('iframe');
    iframe.title = f.getAttribute('data-map-title') || 'Map';
    iframe.src = f.getAttribute('data-map-src');
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.loading = 'lazy';
    iframe.setAttribute('allowfullscreen', '');
    f.innerHTML = '';
    f.appendChild(iframe);
    f.setAttribute('data-loaded', '');
  }
  function loadMaps() { facades.forEach(loadMap); }
  function unloadMaps() {
    facades.forEach(function (f) {
      if (!f.hasAttribute('data-loaded')) return;
      f.innerHTML = f._facade;
      f.removeAttribute('data-loaded');
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-load-map]');
    if (!b) return;
    // Loading the map is the visitor saying yes to Google's cookies, so remember it
    setConsent('maps');
    if (banner && !banner.hidden) hideBanner();
    var f = b.closest('[data-map-src]');
    loadMap(f);
    var iframe = $('iframe', f);
    if (iframe) iframe.focus();
  });

  var consent = getConsent();
  if (consent === 'maps') loadMaps();
  else if (!consent) showBanner(false);

  // ---------- Vercel Web Analytics and Speed Insights (cookieless) ----------
  // Only on the live site: the scripts are served by Vercel and don't exist on a local preview.
  if (location.protocol === 'https:' && !/^(localhost|127\.|\[::1\])/.test(location.hostname)) {
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
    ['/_vercel/insights/script.js', '/_vercel/speed-insights/script.js'].forEach(function (src) {
      var s = document.createElement('script');
      s.src = src;
      s.defer = true;
      document.head.appendChild(s);
    });
  }

  // Exposed for menu.js
  window.MT.reduceMotion = reduceMotion;
})();
