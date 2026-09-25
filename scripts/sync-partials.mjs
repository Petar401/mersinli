#!/usr/bin/env node
// Copies the shared header, footer and mobile order pill from partials/ into every page.
//
//   node scripts/sync-partials.mjs
//
// In each page, a block between
//   <!-- @partial header -->  and  <!-- /@partial -->
// is replaced with partials/header.<lang>.html, where <lang> comes from <html lang="...">.
// {{alt}} becomes the path of the page's other-language twin (from its hreflang link), and the
// nav link for the current page gets aria-current="page". No build step: the output is committed.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://mersinlitantuni.co.uk';

const pages = [
  ...readdirSync(root).filter((f) => f.endsWith('.html')),
  ...readdirSync(join(root, 'tr')).filter((f) => f.endsWith('.html')).map((f) => 'tr/' + f),
];

const pathOf = (file) => {
  const p = '/' + file.replace(/\.html$/, '').replace(/(^|\/)index$/, '');
  return p === '/' ? '/' : p.replace(/\/$/, '');
};

let changed = 0;
for (const file of pages) {
  const full = join(root, file);
  const html = readFileSync(full, 'utf8');
  const lang = /<html lang="tr/.test(html) ? 'tr' : 'en';
  const otherLang = lang === 'tr' ? 'en-GB' : 'tr';
  const altMatch = html.match(new RegExp(`<link rel="alternate" hreflang="${otherLang}" href="([^"]+)"`));
  const alt = altMatch ? altMatch[1].replace(SITE, '') || '/' : lang === 'tr' ? '/' : '/tr';
  const self = pathOf(file);

  const out = html.replace(/<!-- @partial ([\w-]+) -->[\s\S]*?<!-- \/@partial -->/g, (m, name) => {
    const src = join(root, 'partials', `${name}.${lang}.html`);
    if (!existsSync(src)) throw new Error(`${file}: missing partials/${name}.${lang}.html`);
    let body = readFileSync(src, 'utf8').trim().replaceAll('{{alt}}', alt);
    // Mark the current page in the nav (and the logo on the home page)
    body = body.replace(new RegExp(`(<a (?:class="[^"]*" )?href="${self.replace(/[/]/g, '\\/')}")(>)`, 'g'), '$1 aria-current="page"$2');
    return `<!-- @partial ${name} -->\n${body}\n<!-- /@partial -->`;
  });

  if (out !== html) { writeFileSync(full, out); changed++; console.log('updated', file); }
}
console.log(`${pages.length} pages checked, ${changed} updated.`);
