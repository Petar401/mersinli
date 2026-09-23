# Mersinli Tantuni by Choban website

Static site, ready for Vercel. No build step.

## Deploy as a new Vercel project

Option A, in the browser:
1. Go to https://vercel.com/new
2. Choose "Deploy" from a folder, or push this folder to a new GitHub repo and import it
3. Framework preset: Other. Build command: none. Output directory: `./`

Option B, with the Vercel CLI:
```
cd mersinli-tantuni-site
npx vercel          # creates a new project and a preview deployment
npx vercel --prod   # when you're happy, go live
```

## Before launch
- Replace `mersinlitantuni.co.uk` in index.html, menu.html, sitemap.xml, robots.txt and llms.txt with your real domain
- Connect ordering to a real payment or till system (orders are not sent anywhere yet)
