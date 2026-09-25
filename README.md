# Mersinli Tantuni by Choban website

Static site, ready for Vercel. No build step, no framework. Just HTML, CSS and a small script.
English at `/`, Turkish at `/tr`.

## Files

```
index.html               Home page                                   (/)
menu.html                Menu, allergens and online ordering          (/menu)
what-is-tantuni.html     Guide: what tantuni is                       (/what-is-tantuni)
halal-food-norwich.html  Local page: halal food in Norwich            (/halal-food-norwich)
gozleme.html             Guide: gözleme                               (/gozleme)
turkish-drinks.html      Guide: şalgam and ayran                      (/turkish-drinks)
about.html               Our story                                    (/about)
privacy.html             Privacy and cookies                          (/privacy)
404.html                 Not-found page (English and Turkish)
tr/                      Turkish version of every page:
                         index (/tr), menu, tantuni-nedir, norwich-helal-yemek, gozleme,
                         turk-icecekleri, hakkimizda, gizlilik
partials/                Shared header, footer and mobile order pill (English and Turkish)
scripts/
  sync-partials.mjs      Copies partials/ into every page (run after editing a partial)
  check.mjs              Checks links, hreflang, JSON-LD, images and prices before you deploy
assets/
  site.css               Shared styles (colours, motion and shadow tokens at the top)
  menu.css               Styles for the menu pages only (including the phone bottom sheet)
  site.js                Every page: header, mobile menu, cookie banner, click-to-load map,
                         "open now" badge, scroll reveals, mobile order pill, Vercel Analytics.
                         Opening hours live here (OPEN_HOUR, closeHour)
  menu.js                Menu pages: meat picker, gözleme, drinks, basket, bottom sheet,
                         collection times and checkout. English and Turkish strings are in S
  fonts/                 DM Serif Display and Figtree, self-hosted
  img/                   Photos: .jpg plus .webp and .avif, smaller -480/-800/-320 sizes,
                         -thumb.webp for the basket
  img/og/                1200×630 share images for each page (English and og-tr-* Turkish)
  favicon.svg, apple-touch-icon.png
vercel.json              Clean URLs, cache and security headers (including the Content-Security-Policy)
sitemap.xml, robots.txt, llms.txt
```

## Editing

- **Header, footer or the mobile order pill**: edit `partials/*.en.html` and `partials/*.tr.html`, then run
  `node scripts/sync-partials.mjs`. It copies them into every page between `<!-- @partial ... -->` markers,
  links the language switch to each page's twin and highlights the current page in the nav. Don't edit
  between the markers in a page by hand: the next sync overwrites it.
- **Before every deploy**: run `node scripts/check.mjs`. It fails if a link, anchor, image or hreflang
  pair is broken, if JSON-LD is invalid, or if a price in `assets/menu.js` doesn't match the menu JSON-LD.
  Node 18 or newer, no install needed.
- **Text, prices, opening hours**: edit the HTML pages directly, in both languages. Prices also live in
  `assets/menu.js` (`MEATS`, `FOODS`, `DRINKS`: this is what the basket charges) and in the JSON-LD at the
  top of `menu.html`, `tr/menu.html`, `index.html` and `tr/index.html`. Opening hours are also in
  `assets/site.js` (they drive the "open now" badge and the collection times).
- **Turkish pages**: each English page has a Turkish twin in `tr/`. If you change one, change the other.
  The `<link rel="alternate" hreflang>` tags at the top of each page pair them up; keep them as they are.
- **Photos**: put new images in `assets/img/`. Keep them under about 1100px wide. If you replace a `.jpg`,
  replace its `.webp` and `.avif` twins and the smaller sizes too, or delete them.
  Images are cached for 30 days, so give a replacement photo a new file name if it must show up straight away.
- **Stock photos**: a few atmosphere photos on the guide pages (the Mersin coast, a street kitchen, dough,
  the Norwich skyline) load from Unsplash's CDN, with a credit under each, as Unsplash's guidelines ask.
  None of them show our food. Swap them for your own photos whenever you have them.
- **Allergens**: the table is in the `#allergens` section of both menu pages, each item has a short
  "Contains:" line, and the guide pages and FAQ repeat the key points. Update all of them together.
- **Navigation**: on screens up to 1024px wide the header links fold into a menu button. The breakpoint is
  set in both `assets/site.css` and `assets/site.js`, so change both if you move it.
- **CSS and JS caching**: browsers check `assets/*.css` and `assets/*.js` for changes on every visit.
  The `?v=4` on those links is there to push past old cached copies. Bump it if you ever need to.

## How it's built (the premium bits)

- **Motion**: springs, not fixed timings. Buttons scale down on press (not on release), cards lift on
  hover, sections fade up once as they scroll into view. On the menu, the phone basket is a bottom sheet
  you can drag: it follows your finger, keeps your flick's speed, and can be caught mid-animation.
  Everything calms down to simple fades for visitors who turn on "reduce motion".
- **Materials**: the header, menu panel, cookie banner and order bar are translucent (frosted glass),
  with solid fallbacks for "reduce transparency" and "increase contrast".
- **Speed (Core Web Vitals)**: the hero photo is preloaded as AVIF; photos come as AVIF, then WebP, then
  JPEG; basket thumbnails are 2KB; the "open now" badge keeps its space so nothing jumps when it appears.

## Preview locally

```
npx serve .
```

## Deploy

1. Import the GitHub repo at https://vercel.com/new
2. Framework preset: Other. Build command: none. Output directory: `./`

## Launch checklist

- **Domain**: replace `mersinlitantuni.co.uk` everywhere if the real domain is different:
  `grep -rl mersinlitantuni.co.uk --include=*.html --include=*.xml --include=*.txt --include=*.mjs . | xargs sed -i 's/mersinlitantuni\.co\.uk/YOUR-DOMAIN/g'`
  then run `node scripts/check.mjs`.
- **Google Search Console**: add the domain as a *Domain property* (DNS verification in your domain
  settings, or Vercel if it manages DNS), then submit `https://YOUR-DOMAIN/sitemap.xml`. The sitemap lists
  both languages with hreflang, so Google knows `/tr` pages are the Turkish versions, not duplicates.
- **Google Business Profile**: create or claim it with exactly the same name, address and hours as the site,
  and set the website link to the home page and the menu link to `/menu`.
- **Turkish copy**: the Turkish pages were translated carefully, but please have a native speaker read
  them before launch.
- **Still to add** once known (all help Google and the Business Profile):
  - Phone number with a tap-to-call link (header menu, Find us, footer, and `telephone` in the Restaurant JSON-LD).
  - `geo` coordinates and `sameAs` links (Google Business Profile, Instagram, TikTok, Facebook) in the
    Restaurant JSON-LD on `index.html`, `tr/index.html` and both halal pages.
  - A contact email for data questions on both privacy pages.
  - Your own story on the About pages: look for `TODO owner story` in `about.html` and `tr/hakkimizda.html`.
  - Update `<lastmod>` in `sitemap.xml` when page content changes.

## Online ordering, Stripe and Telegram (next step)

- **Online ordering is a preview.** The checkout shows a confirmation, but the order isn't sent anywhere
  yet. The page tells customers this.
- Customers already choose **Cash when you collect** or **Card online** (card shows "Coming soon").
- `placeOrder()` in `assets/menu.js` is the single hook. It receives `name`, `phone`, `time`, `notes`,
  `payment` (`cash` or `card`), `lang` and the `items`. To go live:
  1. Add a Vercel serverless function (for example `api/order.js`) that re-prices the items on the server
     from the same catalogue (never trust prices from the browser), sends the order to the shop's Telegram
     chat (bot token and chat ID as Vercel environment variables), and for `card` creates a Stripe Checkout
     Session and returns its URL.
  2. In `placeOrder()`, POST the order to it; for card orders redirect to the returned URL.
  3. Set `PAYMENT_ONLINE_ENABLED = true` at the top of `assets/menu.js`.
  4. Add Stripe to the Content-Security-Policy in `vercel.json`: `https://js.stripe.com` to `script-src`
     and `frame-src`, `https://api.stripe.com` to `connect-src`, and `https://checkout.stripe.com` to
     `form-action`.
  5. Remove the `.demo-note` messages in both menu pages and update both privacy pages.

## Cookies, privacy and analytics

- Nothing on the site sets cookies unless the visitor allows Google Maps. The basket and the cookie choice are kept
  in localStorage (`mt_basket`, `mt_consent`). The basket counts as strictly necessary, so it needs no consent.
  The basket is shared between the English and Turkish menu pages.
- The map on the homepage is a placeholder until the visitor clicks "Show the map" or picks "Allow Google Maps" in
  the banner. "Cookie settings" in the footer reopens the banner.
- **Vercel Web Analytics and Speed Insights** are cookieless and load automatically on the live site. Turn both on
  in the Vercel dashboard (Project → Analytics, and Project → Speed Insights), or nothing is recorded.
- If you add anything that sets cookies or tracks visitors (Google Analytics, a Facebook pixel, a booking widget),
  gate it behind the banner, add its domains to the Content-Security-Policy, and update both privacy pages.
- The Content-Security-Policy blocks Vercel's preview comments toolbar on preview deployments. If you want it
  there, add `https://vercel.live` to `script-src`, `connect-src` and `frame-src`.

## ⚠️ Verify before launch

**Allergens** were drafted from typical recipes and have not been checked against the real recipes and supplier
labels. Please check each one, and correct the menu pages, guide pages and home page FAQ (both languages) if anything
is different:

- Lavash (tantuni): wheat. Check the supplier label for sesame, soya or milk.
- Cooking fat for tantuni: assumed to be vegetable oil. If butter is used, add **milk** to both tantuni.
- Pickled peppers (tantuni plate): may contain sulphites. Check the jar.
- Gözleme dough: wheat. Some recipes use egg or yoghurt. Check, and update the "Ask us if you avoid egg" note.
- Gözleme cheese: milk. The **Vegetarian** badge assumes the cheese uses non-animal rennet. Check the packs.
- Şalgam (Turnib): usually made with bulgur (wheat) flour. Check the bottle.
- Ayran: milk. Fanta Orange, Fanta Lemon and Hayat water: no listed allergens. Check the current labels.

**Halal**: the site says all chicken, beef and lamb is halal. Keep supplier certificates to hand.
