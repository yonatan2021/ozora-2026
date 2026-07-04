# SEO Optimization and Vercel Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transition the Ozora 2026 app to Vercel with path-based routing (`BrowserRouter`), root-level deployment, dynamic/bilingual SEO meta tags, Robots.txt, Sitemap.xml, and JSON-LD event schema.

**Architecture:** Switch React Router to `BrowserRouter`. Set base to `/` in Vite configuration. Configure dynamic metadata in `App.jsx` using vanilla DOM manipulation to create/update `<meta>` and `<meta property="og:*">` tags. Deploy a `vercel.json` rewrite file to route all path requests to the entry point `index.html`.

**Tech Stack:** React, React Router, Vite, Vite PWA, Vitest

---

### Task 1: Update Router to BrowserRouter

**Files:**
- Modify: `src/router.jsx`
- Test: `src/App.spec.jsx`

- [ ] **Step 1: Modify router config in `src/router.jsx` to use BrowserRouter**
  Replace `createHashRouter` with `createBrowserRouter`.
  
  *Target Content:*
  ```javascript
  import { createHashRouter, Navigate } from 'react-router-dom';
  // ...
  export const router = createHashRouter(routes);
  ```
  
  *Replacement Content:*
  ```javascript
  import { createBrowserRouter, Navigate } from 'react-router-dom';
  // ...
  export const router = createBrowserRouter(routes);
  ```

- [ ] **Step 2: Run tests to verify existing router tests pass with standard routes**
  Run: `npm run test`
  Expected: All tests pass (as `createMemoryRouter` is used in tests, it is unaffected, but good to verify).

- [ ] **Step 3: Commit changes**
  Run:
  ```bash
  git add src/router.jsx
  git commit -m "feat: switch router from createHashRouter to createBrowserRouter"
  ```

---

### Task 2: Configure Vite and PWA for Root-Level Deployment

**Files:**
- Modify: `vite.config.js`

- [ ] **Step 1: Modify base path and PWA scope in `vite.config.js`**
  Change base path to `/` and PWA scope/start_url configurations to `/` to match Vercel's root-level structure.
  
  *Target Content:*
  ```javascript
        display: 'standalone',
        scope: '/ozora-2026/',
        start_url: '/ozora-2026/',
        icons: [
  // ...
    base: '/ozora-2026/',
  ```
  
  *Replacement Content:*
  ```javascript
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
  // ...
    base: '/',
  ```

- [ ] **Step 2: Commit changes**
  Run:
  ```bash
  git add vite.config.js
  git commit -m "config: update vite base and PWA scope for root-level Vercel hosting"
  ```

---

### Task 3: Create Vercel Rewrite Configuration

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Write `vercel.json` in project root directory**
  Create the rewrite config to support SPA path fallback.
  
  Code for `vercel.json`:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```

- [ ] **Step 2: Commit changes**
  Run:
  ```bash
  git add vercel.json
  git commit -m "config: add vercel.json rewrite rules for React SPA routing"
  ```

---

### Task 4: Add Robots.txt and Sitemap.xml

**Files:**
- Create: `public/robots.txt`
- Create: `public/sitemap.xml`

- [ ] **Step 1: Create `public/robots.txt`**
  Add the following search index constraints:
  ```text
  User-agent: *
  Allow: /
  Sitemap: https://ozora-2026.vercel.app/sitemap.xml
  ```

- [ ] **Step 2: Create `public/sitemap.xml`**
  Map standard routing endpoints.
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

- [ ] **Step 3: Commit changes**
  Run:
  ```bash
  git add public/robots.txt public/sitemap.xml
  git commit -m "seo: add robots.txt and sitemap.xml for crawler discovery"
  ```

---

### Task 5: Enhance index.html Metadata & Structured Data

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add default meta tags, OG, Twitter Cards, and Event Structured Data to `index.html`**
  Update `<head>` with rich defaults and the event schema.
  
  *Target Content:*
  ```html
    <head>
      <meta charset="UTF-8" />
      <link rel="icon" type="image/png" href="/favicon.png" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>ozora-2026</title>
    </head>
  ```
  
  *Replacement Content:*
  ```html
    <head>
      <meta charset="UTF-8" />
      <link rel="icon" type="image/png" href="/favicon.png" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Ozora Festival 2026 Timetable & Map - Cosmic Companion</title>
      <meta name="description" content="Ozora Festival 2026 interactive timetable, offline map, custom schedule planner, and cosmic festival guide. Works 100% offline. / לוח הופעות אוזורה 2026 ומפת אופליין." />
      
      <!-- Open Graph / Facebook -->
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://ozora-2026.vercel.app/" />
      <meta property="og:title" content="Ozora Festival 2026 Timetable & Map - Cosmic Companion" />
      <meta property="og:description" content="Ozora Festival 2026 interactive timetable, offline map, custom schedule planner, and cosmic festival guide. Works 100% offline. / לוח הופעות אוזורה 2026 ומפת אופליין." />
      <meta property="og:image" content="/ozora_banner.png" />

      <!-- Twitter -->
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content="https://ozora-2026.vercel.app/" />
      <meta name="twitter:title" content="Ozora Festival 2026 Timetable & Map - Cosmic Companion" />
      <meta name="twitter:description" content="Ozora Festival 2026 interactive timetable, offline map, custom schedule planner, and cosmic festival guide. Works 100% offline." />
      <meta name="twitter:image" content="/ozora_banner.png" />

      <!-- Event Structured Data -->
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
    </head>
  ```

- [ ] **Step 2: Commit changes**
  Run:
  ```bash
  git add index.html
  git commit -m "seo: update index.html default tags and inject event structured data"
  ```

---

### Task 6: Add Dynamic Meta Updates to App.jsx

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.spec.jsx`

- [ ] **Step 1: Update navigation `useEffect` in `src/App.jsx` to dynamically update description and Open Graph descriptions**
  Let the metadata match the active language and page.
  
  *Target Content:*
  ```javascript
    useEffect(() => {
      let pageTitle = 'Timetable';
      if (location.pathname.startsWith('/favorites')) {
        pageTitle = 'My Schedule';
      } else if (location.pathname.startsWith('/map')) {
        pageTitle = 'Map';
      } else if (location.pathname.startsWith('/guide')) {
        pageTitle = 'Guide';
      }
  
      document.title = `Ozora 2026 - ${pageTitle}`;
  
      trackEvent('page_view', {
        page_path: location.pathname,
        page_title: pageTitle
      });
    }, [location]);
  ```
  
  *Replacement Content:*
  ```javascript
    useEffect(() => {
      let pageTitle = 'Timetable';
      let metaDescText = 'Complete Ozora Festival 2026 timetable. Search artists, filter by stages and days, and plan your schedules.';
      
      const isHe = lang === 'he';

      if (location.pathname.startsWith('/favorites')) {
        pageTitle = isHe ? 'הלוח שלי' : 'My Schedule';
        metaDescText = isHe 
          ? 'לוח ההופעות האישי שלי לפסטיבל אוזורה 2026. סמן אמנים בכוכב כדי לתכנן את הלוז שלך.' 
          : 'My custom schedule for Ozora Festival 2026. Star your favorite artists to stay coordinated.';
      } else if (location.pathname.startsWith('/map')) {
        pageTitle = isHe ? 'מפה' : 'Map';
        metaDescText = isHe 
          ? 'מפה אינטראקטיבית אופליין של פסטיבל אוזורה 2026 עם אפשרות לסימון מיקום האוהל וניווט לבמות.' 
          : 'Interactive offline map of Ozora Festival 2026. View stages, navigate, and pin your campsite.';
      } else if (location.pathname.startsWith('/guide')) {
        pageTitle = isHe ? 'מדריך' : 'Guide';
        metaDescText = isHe 
          ? 'המדריך המלא למבקר בפסטיבל אוזורה 2026 - המלצות, טיפים, צ\'ק ליסט ציוד וכל מה שצריך לדעת.' 
          : 'The ultimate survival guide for Ozora Festival 2026 with packing checklist, tips, and guidelines.';
      } else {
        pageTitle = isHe ? 'לוח הופעות' : 'Timetable';
        metaDescText = isHe 
          ? 'לוח הופעות מלא ומפורט של פסטיבל אוזורה 2026 עם חיפוש אמנים וסינון לפי ימים ובמות.' 
          : 'Complete Ozora Festival 2026 timetable. Search artists, filter by stages and days, and plan your schedules.';
      }
  
      document.title = `Ozora 2026 - ${pageTitle}`;

      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', metaDescText);

      // Update Open Graph description
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (!ogDesc) {
        ogDesc = document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description');
        document.head.appendChild(ogDesc);
      }
      ogDesc.setAttribute('content', metaDescText);
  
      trackEvent('page_view', {
        page_path: location.pathname,
        page_title: pageTitle
      });
    }, [location, lang]);
  ```

- [ ] **Step 2: Add test to `src/App.spec.jsx` to verify meta description updates on tab switch**
  Verify the DOM gets updated correctly.
  
  *Add this test inside describe in `src/App.spec.jsx`:*
  ```javascript
    it('should dynamically update the meta description when switching tabs', () => {
      renderApp();
      
      // Select english
      fireEvent.click(screen.getByRole('button', { name: /English/i }));
      
      // Default /timetable
      let metaDesc = document.querySelector('meta[name="description"]');
      expect(metaDesc).toBeTruthy();
      expect(metaDesc.getAttribute('content')).toContain('Complete Ozora Festival 2026 timetable');

      // Go to guide
      const guideNavBtn = screen.getAllByRole('button', { name: /Guide/i })[0];
      fireEvent.click(guideNavBtn);
      
      metaDesc = document.querySelector('meta[name="description"]');
      expect(metaDesc.getAttribute('content')).toContain('The ultimate survival guide');
    });
  ```

- [ ] **Step 3: Run tests to verify the new metadata logic passes**
  Run: `npm run test`
  Expected: PASS all tests.

- [ ] **Step 4: Commit changes**
  Run:
  ```bash
  git add src/App.jsx src/App.spec.jsx
  git commit -m "feat: add dynamic meta tag updates and add coverage tests"
  ```

---

### Task 7: Final Build Verification

- [ ] **Step 1: Run production build compilation**
  Run: `npm run build`
  Expected: Build succeeds with no warnings or errors, outputs correctly to `dist/`.
