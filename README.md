# withGrowth — cinematic site

Static site for withGrowth (Riyadh). One scroll-driven brand film plays behind the whole page.

- `site/` — deployable static site (open `site/index.html` or serve the folder).
- `site/config.js` — name, WhatsApp, contact email, frame paths.
- `site/assets/frames/` — the film sliced to WebP frames (desktop 1920px, phone 720px).
- `brief.json` — brief, media sources and concept.

Run locally:

    cd site && python3 -m http.server 4174

Deploy: upload the `site/` folder to any static host (Vercel, Netlify, GitHub Pages).
