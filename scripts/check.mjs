#!/usr/bin/env node
// Pre-deploy checks for the static site. No dependencies.
//
//   node scripts/check.mjs
//
// Checks every page for: one <h1>, a <title> and meta description, a canonical URL,
// reciprocal hreflang links, valid JSON-LD, internal links and #anchors that resolve,
// local images/assets that exist, and <img> width/height/alt. Also checks that menu
// prices in menu.js match the prices Google reads from the JSON-LD.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://mersinlitantuni.co.uk';
const errors = [];
const warn = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);

const files = [
  ...readdirSync(root).filter((f) => f.endsWith('.html')),
  ...readdirSync(join(root, 'tr')).filter((f) => f.endsWith('.html')).map((f) => 'tr/' + f),
];
const pathOf = (file) => {
  const p = '/' + file.replace(/\.html$/, '').replace(/(^|\/)index$/, '');
  return p === '/' ? '/' : p.replace(/\/$/, '');
};
const fileOf = (path) => {
  if (path === '/') return 'index.html';
  const clean = path.replace(/^\//, '').replace(/\/$/, '');
  if (existsSync(join(root, clean + '.html'))) return clean + '.html';
  if (existsSync(join(root, clean, 'index.html'))) return clean + '/index.html';
  return null;
};

const pages = {};
for (const file of files) {
  const html = readFileSync(join(root, file), 'utf8');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  pages[file] = { html, ids, path: pathOf(file) };
}

for (const [file, { html, path }] of Object.entries(pages)) {
  const is404 = file === '404.html';
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) err(file, `expected one <h1>, found ${h1s}`);
  if (!/<title>[^<]{10,}<\/title>/.test(html)) err(file, 'missing <title>');
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  if (title.length > 70) warn.push(`${file}: title is ${title.length} characters (Google shows about 60)`);
  if (!is404) {
    const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
    if (!desc) err(file, 'missing meta description');
    else if (desc.length > 170) warn.push(`${file}: description is ${desc.length} characters (Google shows about 155)`);
    const canon = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    if (canon !== SITE + path) err(file, `canonical ${canon} should be ${SITE + path}`);
  }
  if (/@partial [\w-]+ -->\s*<!-- \/@partial/.test(html)) err(file, 'empty partial: run node scripts/sync-partials.mjs');
  if (/\{\{alt\}\}/.test(html)) err(file, 'unfilled {{alt}}: run node scripts/sync-partials.mjs');

  // hreflang: the other-language page must point back here
  const alts = Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]));
  if (!is404) {
    for (const lang of ['en-GB', 'tr', 'x-default']) if (!alts[lang]) err(file, `missing hreflang ${lang}`);
    const self = /<html lang="tr/.test(html) ? 'tr' : 'en-GB';
    if (alts[self] !== SITE + path) err(file, `hreflang ${self} should point to itself (${SITE + path})`);
    const other = self === 'tr' ? 'en-GB' : 'tr';
    const twin = alts[other] && fileOf(alts[other].replace(SITE, '') || '/');
    if (!twin) err(file, `hreflang ${other} points to a missing page: ${alts[other]}`);
    else {
      const back = [...pages[twin].html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].find((m) => m[1] === self);
      if (!back || back[2] !== SITE + path) err(file, `${twin} does not link back with hreflang ${self}`);
    }
  }

  // JSON-LD
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { err(file, 'invalid JSON-LD: ' + e.message); }
  }

  // Links and anchors
  const body = html.replace(/<script[\s\S]*?<\/script>/g, '');
  for (const m of body.matchAll(/\shref="([^"]+)"/g)) {
    const href = m[1].replaceAll('&amp;', '&');
    if (/^(https?:|mailto:|tel:|data:)/.test(href)) continue;
    const [pathPart, hash] = href.split('#');
    const target = pathPart === '' ? file : pathPart.startsWith('/assets/') ? null : fileOf(pathPart.split('?')[0]);
    if (pathPart.startsWith('/assets/')) {
      if (!existsSync(join(root, pathPart.split('?')[0]))) err(file, `missing asset ${pathPart}`);
      continue;
    }
    if (!target) { err(file, `broken link ${href}`); continue; }
    if (hash && hash !== 'main' && !pages[target].ids.has(hash)) err(file, `link ${href}: no #${hash} on ${target}`);
  }

  // Local images and sources
  for (const m of body.matchAll(/\s(?:src|srcset|imagesrcset)="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const url = part.trim().split(/\s+/)[0];
      if (url.startsWith('/') && !existsSync(join(root, url.split('?')[0]))) err(file, `missing file ${url}`);
    }
  }
  for (const m of body.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    if (!/\swidth="\d+"/.test(tag) || !/\sheight="\d+"/.test(tag)) err(file, `<img> without width/height: ${tag.slice(0, 80)}`);
    if (!/\salt="/.test(tag)) err(file, `<img> without alt: ${tag.slice(0, 80)}`);
  }
}

// Prices: menu.js is what the basket charges; the JSON-LD is what Google shows
const menuJs = readFileSync(join(root, 'assets/menu.js'), 'utf8');
const jsPrice = (id) => Number((menuJs.match(new RegExp(`${id}'?:\\s*\\{[\\s\\S]*?price:\\s*([\\d.]+)`)) || [])[1]);
const expected = { 'Chicken Tantuni': jsPrice('chicken'), 'Beef and Lamb Tantuni': jsPrice('mix'), 'Gözleme': jsPrice('gozleme'), 'Şalgam (Turnib)': jsPrice('salgam') };
const menuLd = JSON.parse(pages['menu.html'].html.match(/<script type="application\/ld\+json">(\{"@context":"https:\/\/schema.org","@type":"Menu"[\s\S]*?)<\/script>/)[1]);
for (const section of menuLd.hasMenuSection) {
  for (const item of section.hasMenuItem) {
    if (item.name in expected && Number(item.offers.price) !== expected[item.name]) {
      err('menu.html', `JSON-LD price for ${item.name} is ${item.offers.price}, menu.js charges ${expected[item.name]}`);
    }
  }
}

for (const w of warn) console.log('warn  ' + w);
if (errors.length) {
  for (const e of errors) console.log('ERROR ' + e);
  console.log(`\n${errors.length} problem(s) in ${files.length} pages.`);
  process.exit(1);
}
console.log(`All good: ${files.length} pages checked.`);
