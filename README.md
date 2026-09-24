# Mersinli Tantuni by Choban website

Static site, ready for Vercel. No build step, no framework. Just HTML, CSS and a small script.

## Files

```
index.html          Home page
menu.html           Menu, allergens and online ordering (served at /menu)
privacy.html        Privacy and cookies page (served at /privacy)
404.html            Not-found page
assets/
  site.css          Shared styles (colours are CSS variables at the top)
  menu.css          Styles for the menu page only
  site.js           Every page: mobile menu button, cookie banner, click-to-load Google map,
                    "open now" badge, Vercel Analytics
  menu.js           Menu page logic: meat picker, gözleme, drinks, basket, checkout
  fonts/            DM Serif Display and Figtree, self-hosted
  img/              Photos (.jpg plus a smaller .webp of each; big photos also have -480 and -800 sizes)
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
  or delete its `.webp` twin as well. Browsers prefer the `.webp` when one exists. The hero, tantuni, gözleme and
  emblem photos also have `-480` and `-800` copies (listed in `srcset`) so phones download a smaller file. Replace
  those too if you change one of those photos.
- **Allergens**: the table is in the `#allergens` section of `menu.html`, and each item also has a short
  "Contains:" line (on its card in `menu.html` and `index.html`). Update all of them together, plus the allergen
  answer in the FAQ on `index.html` (visible text and JSON-LD).
- **Navigation**: on screens up to 1024px wide the header links fold into a menu button. The breakpoint is set in
  both `assets/site.css` and `assets/site.js`, so change both if you move it.
- **CSS and JS caching**: browsers check `assets/*.css` and `assets/*.js` for changes on every visit, so edits show
  up straight away. The `?v=3` on those links in the HTML is there to push past copies cached under the old
  7-day rule. Bump it if you ever need to force a refresh.

## Preview locally

```
npx serve .
```

## Deploy

1. Import the GitHub repo at https://vercel.com/new
2. Framework preset: Other. Build command: none. Output directory: `./`

## Before launch

- Replace `mersinlitantuni.co.uk` in index.html, menu.html, privacy.html, sitemap.xml, robots.txt and llms.txt with your real domain.
- **Online ordering is a preview.** The checkout shows a confirmation, but the order isn't sent anywhere yet.
  The page tells customers this.
- **Stripe TODO:** `placeOrder()` in `assets/menu.js` is the single hook. Add a Vercel serverless function
  (for example `api/checkout.js`) that creates a Stripe Checkout Session from the basket items, and have
  `placeOrder()` redirect to it. Then remove the `.demo-note` messages in `menu.html`.

## Cookies, privacy and analytics

- Nothing on the site sets cookies unless the visitor allows Google Maps. The basket and the cookie choice are kept
  in localStorage (`mt_basket`, `mt_consent`). The basket counts as strictly necessary, so it needs no consent.
- The map on the homepage is a placeholder until the visitor clicks "Show the map" or picks "Allow Google Maps" in
  the banner. "Cookie settings" in the footer reopens the banner.
- **Vercel Web Analytics and Speed Insights** are cookieless and load automatically on the live site. Turn both on
  in the Vercel dashboard (Project → Analytics, and Project → Speed Insights), or nothing is recorded.
- If you add anything that sets cookies or tracks visitors (Google Analytics, a Facebook pixel, a booking widget),
  gate it behind the banner and update `privacy.html`.

## ⚠️ Verify before launch

**Allergens** were drafted from typical recipes and have not been checked against the real recipes and supplier
labels. Please check each one, and correct `menu.html` and `index.html` if anything is different:

- Lavash (tantuni): wheat. Check the supplier label for sesame, soya or milk.
- Cooking fat for tantuni: assumed to be vegetable oil. If butter is used, add **milk** to both tantuni.
- Pickled peppers (tantuni plate): may contain sulphites. Check the jar.
- Gözleme dough: wheat. Some recipes use egg or yoghurt. Check, and update the "Ask us if you avoid egg" note.
- Gözleme cheese: milk. The **Vegetarian** badge assumes the cheese uses non-animal rennet. Check the packs.
- Şalgam (Turnib): usually made with bulgur (wheat) flour. Check the bottle.
- Ayran: milk. Fanta Orange, Fanta Lemon and Hayat water: no listed allergens. Check the current labels.

**Halal**: the site says all chicken, beef and lamb is halal. Keep supplier certificates to hand.

**Still to add** once known (all help Google and the Google Business Profile):

- Phone number with a tap-to-call link (header menu, Find us, footer, and `telephone` in the Restaurant JSON-LD).
- `geo` coordinates and `sameAs` links to social profiles and the Google Business Profile in the JSON-LD.
- A contact email for data questions on `privacy.html`.
- Update `<lastmod>` in `sitemap.xml` when page content changes.
