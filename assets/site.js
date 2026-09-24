// Shared on every page: mobile menu, cookie choices, click-to-load map, "open now" badge, Vercel Analytics.
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // ---------- Mobile menu ----------
  var header = $('.site-header');
  var toggle = $('.nav-toggle');
  var menu = toggle && document.getElementById(toggle.getAttribute('aria-controls'));
  // Must match the breakpoint in site.css
  var desktop = window.matchMedia('(min-width: 1025px)');

  function setMenu(open, returnFocus) {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) header.setAttribute('data-menu-open', '');
    else header.removeAttribute('data-menu-open');
    if (open) { var first = $('a', menu); if (first) first.focus(); }
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

  // ---------- "Open now" badge, based on UK time (10:00–22:00 Sun–Thu, 10:00–23:00 Fri–Sat) ----------
  var badges = $$('[data-open-now]');
  if (badges.length) {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short', hour: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      var get = function (type) { return parts.find(function (p) { return p.type === type; }).value; };
      var hour = parseInt(get('hour'), 10);
      var close = /^(Fri|Sat)/.test(get('weekday')) ? 23 : 22;
      var open = hour >= 10 && hour < close;
      badges.forEach(function (el) {
        el.textContent = open ? 'Open now, until ' + (close - 12) + 'pm' : 'Closed now, opens at 10am';
        el.classList.toggle('is-open', open);
        el.hidden = false;
      });
    } catch (e) {}
  }

  // ---------- Cookie choices ----------
  // Only Google Maps sets cookies. The basket (localStorage) is strictly necessary and needs no consent.
  var CONSENT_KEY = 'mt_consent';
  function getConsent() { try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem(CONSENT_KEY, v); } catch (e) {} }

  var banner, bannerReturn;
  function buildBanner() {
    banner = document.createElement('section');
    banner.className = 'cookie-banner';
    banner.setAttribute('aria-labelledby', 'cookie-title');
    banner.innerHTML =
      '<h2 id="cookie-title" tabindex="-1">Cookies</h2>' +
      '<p>We keep your order basket on this device so it is still there when you come back. We don\'t use tracking or advertising cookies. ' +
      'Our map comes from Google, which sets its own cookies, so we only load it if you say yes. <a href="/privacy">Privacy and cookies</a></p>' +
      '<div class="cookie-actions">' +
      '<button type="button" class="btn btn-red" data-consent="maps">Allow Google Maps</button>' +
      '<button type="button" class="btn btn-outline" data-consent="essential">Essential only</button>' +
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
})();
