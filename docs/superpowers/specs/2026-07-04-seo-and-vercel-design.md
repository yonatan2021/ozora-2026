# Design Spec: SEO Optimization and Vercel Transition

This document outlines the changes required to optimize SEO and search performance for the Ozora 2026 Timetable Companion. It includes transitioning the routing system from `HashRouter` to `BrowserRouter`, preparing configuration for Vercel deployment, enhancing default and dynamic meta tags, embedding JSON-LD event schema, and providing search engines with a `robots.txt` and `sitemap.xml`.

## 1. Goal & Context
The goal is to rank for search queries in both Hebrew and English related to the Ozora Festival 2026 timetable, offline map, and guide. Since client-side routing using hash segments (`#/timetable`) is less indexable and shares less beautifully, we are transitioning to standard path-based routing (`/timetable`). We are targeting Vercel as the hosting platform to get free CDN hosting, native single-page application (SPA) routing, and root-level paths (unlike GitHub Pages which has a subfolder prefix `/ozora-2026/`).

---

## 2. Proposed Changes

### 2.1. Routing & Infrastructure Config

#### [MODIFY] [router.jsx](file:///Users/yonig/Desktop/projects/Ozora-2026/src/router.jsx)
We will switch from `createHashRouter` to `createBrowserRouter` to enable standard clean paths.

#### [MODIFY] [vite.config.js](file:///Users/yonig/Desktop/projects/Ozora-2026/vite.config.js)
* Change base url to `/` (Vercel hosts at root level).
* Update `VitePWA` config:
  * Update `manifest.scope` to `/`.
  * Update `manifest.start_url` to `/`.

#### [NEW] `vercel.json` (Root level)
Create a new file [vercel.json](file:///Users/yonig/Desktop/projects/Ozora-2026/vercel.json) to rewrite all requests back to `/index.html` on the server-side, enabling standard React Router navigation without 404s.
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 3. Metadata & Open Graph

### 3.1. Default HTML Headings
Add standard meta tags, Open Graph (OG) tags, and Twitter Cards to [index.html](file:///Users/yonig/Desktop/projects/Ozora-2026/index.html) to provide a high-quality default preview:
* Update `<title>` to: `Ozora Festival 2026 Timetable & Map - Cosmic Companion`
* Add `<meta name="description" content="Ozora Festival 2026 interactive timetable, offline map, custom schedule planner, and cosmic festival guide. Works 100% offline. / לוח הופעות אוזורה 2026 ומפת אופליין." />`
* Add Open Graph meta tags:
  ```html
  <meta property="og:title" content="Ozora Festival 2026 Timetable & Map - Cosmic Companion" />
  <meta property="og:description" content="Ozora Festival 2026 interactive timetable, offline map, custom schedule planner, and cosmic festival guide. Works 100% offline. / לוח הופעות אוזורה 2026 ומפת אופליין." />
  <meta property="og:image" content="/ozora_banner.png" />
  <meta property="og:url" content="https://ozora-2026.vercel.app/" />
  <meta property="og:type" content="website" />
  ```
* Add Twitter Card tags:
  ```html
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Ozora Festival 2026 Timetable & Map - Cosmic Companion" />
  <meta name="twitter:description" content="Ozora Festival 2026 interactive timetable, offline map, custom schedule planner, and cosmic festival guide. Works 100% offline." />
  <meta name="twitter:image" content="/ozora_banner.png" />
  ```

### 3.2. Dynamic Meta Updates in [App.jsx](file:///Users/yonig/Desktop/projects/Ozora-2026/src/App.jsx)
Update the navigation `useEffect` to dynamically change the `<meta name="description">` and `og:description` along with the document title according to the current route and language:
* Hebrew descriptions:
  * `/timetable`: "לוח הופעות מלא ומפורט של פסטיבל אוזורה 2026 עם חיפוש אמנים וסינון לפי ימים ובמות."
  * `/favorites`: "לוח ההופעות האישי שלי לפסטיבל אוזורה 2026. סמן אמנים בכוכב כדי לתכנן את הלוז שלך."
  * `/map`: "מפה אינטראקטיבית אופליין של פסטיבל אוזורה 2026 עם אפשרות לסימון מיקום האוהל וניווט לבמות."
  * `/guide`: "המדריך המלא למבקר בפסטיבל אוזורה 2026 - המלצות, טיפים, צ'ק ליסט ציוד וכל מה שצריך לדעת."
* English descriptions:
  * `/timetable`: "Complete Ozora Festival 2026 timetable. Search artists, filter by stages and days, and plan your schedules."
  * `/favorites`: "My custom schedule for Ozora Festival 2026. Star your favorite artists to stay coordinated."
  * `/map`: "Interactive offline map of Ozora Festival 2026. View stages, navigate, and pin your campsite."
  * `/guide`: "The ultimate survival guide for Ozora Festival 2026 with packing checklist, tips, and guidelines."

---

## 4. Structured Data (JSON-LD Event Schema)
Embed a JSON-LD event block in `<head>` inside [index.html](file:///Users/yonig/Desktop/projects/Ozora-2026/index.html) to allow Google to show a rich Search snippet:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "MusicFestival",
  "name": "Ozora Festival 2026",
  "description": "Interactive timetable, offline map, custom schedule planner, and cosmic guide for Ozora Festival 2026.",
  "startDate": "2026-07-25T12:00:00+02:00",
  "endDate": "2026-08-03T18:00:00+02:00",
  "location": {
    "@type": "Place",
    "name": "Ozora Festival Grounds",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Dádpuszta",
      "addressCountry": "HU"
    }
  },
  "offers": {
    "@type": "Offer",
    "url": "https://ozora.hu",
    "priceCurrency": "EUR"
  },
  "image": "https://ozora-2026.vercel.app/ozora_banner.png"
}
</script>
```

---

## 5. Robots.txt and Sitemap

#### [NEW] [robots.txt](file:///Users/yonig/Desktop/projects/Ozora-2026/public/robots.txt)
```text
User-agent: *
Allow: /
Sitemap: https://ozora-2026.vercel.app/sitemap.xml
```

#### [NEW] [sitemap.xml](file:///Users/yonig/Desktop/projects/Ozora-2026/public/sitemap.xml)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://ozora-2026.vercel.app/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://ozora-2026.vercel.app/timetable</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://ozora-2026.vercel.app/map</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://ozora-2026.vercel.app/guide</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://ozora-2026.vercel.app/favorites</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

---

## 6. Verification Plan

### 6.1. Automated Tests
* Run `npm run test` to verify that existing test suites (e.g. `App.spec.jsx`) pass with `BrowserRouter`.
* Verify that build compiles cleanly (`npm run build`).

### 6.2. Manual Verification
* Run local dev server (`npm run dev`) and test navigating between different tabs.
* Inspect HTML document structure and ensure correct tags and JSON-LD schema exist.
* Verify dynamic description changes by inspecting the `<meta>` attributes in the DOM when navigating tabs.
