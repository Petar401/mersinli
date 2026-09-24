# Mersinli Tantuni by Choban website

Static site, ready for Vercel. No build step, no framework. Just HTML, CSS and a small script.

## Files

```
index.html          Home page
menu.html           Menu and online ordering (served at /menu)
404.html            Not-found page
assets/
  site.css          Shared styles (colours are CSS variables at the top)
  menu.css          Styles for the menu page only
  menu.js           Menu page logic: meat picker, gözleme, drinks, basket, checkout
  fonts/            DM Serif Display and Figtree, self-hosted
  img/              Photos (.jpg plus a smaller .webp of each)
  favicon.svg, apple-touch-icon.png
vercel.json         Clean URLs (/menu) and cache headers
sitemap.xml, robots.txt, llms.txt
```

This replaces the original Claude Design export. The export was a JavaScript bundle that pointed images at
`/assets/...` while the photos sat in the root folder, so most images didn't load once it was deployed.

## Editing

- **Text, prices, opening hours**: edit `index.html` and `menu.html` directly. Menu prices also live in
  `assets/menu.js` (`MEATS`, `FOODS` and `DRINKS`), and in the JSON-LD blocks at the top of each page (Google reads those).
- **Photos**: put new images in `assets/img/`. Keep them under about 1100px wide. If you replace a `.jpg`, replace
  or delete its `.webp` twin as well. Browsers prefer the `.webp` when one exists.

## Preview locally

```
npx serve .
```

## Deploy

1. Import the GitHub repo at https://vercel.com/new
2. Framework preset: Other. Build command: none. Output directory: `./`

## Before launch

- Replace `mersinlitantuni.co.uk` in index.html, menu.html, sitemap.xml, robots.txt and llms.txt with your real domain.
- **Online ordering is a preview.** The checkout shows a confirmation, but the order isn't sent anywhere yet.
  The page tells customers this.
- **Stripe TODO:** `placeOrder()` in `assets/menu.js` is the single hook. Add a Vercel serverless function
  (for example `api/checkout.js`) that creates a Stripe Checkout Session from the basket items, and have
  `placeOrder()` redirect to it. Then remove the `.demo-note` messages in `menu.html`.
