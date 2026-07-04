# קידום אתרים (SEO) ושדרוג מטא-דאטה לפסטיבל אוזורה 2026 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** להפוך את האתר למותאם למנועי חיפוש (SEO-optimized) תחת הדומיין הקנוני החדש `ozora-2026-taupe.vercel.app`, כולל מטא-טאגס מותאמים, תוכן fallback סטטי עשיר במילות מפתח בתוך ה-root div, סכמות JSON-LD מובנות (FAQPage, MusicFestival), ועדכון קנוני דינמי במעברי דפים.

**Architecture:** 
1. עדכון קבצי ה-SEO הסטטיים ב-`public/` (Sitemap ו-Robots).
2. הוספת מטא-טאגס, תגית Canonical, סכמת פסטיבל וסכמת שאלות נפוצות (FAQ) ב-`index.html`.
3. הזרקת תוכן HTML סמנטי ומפורט לתוך ה-`div` של `root` כדי שייסרק מיידית על ידי מנועי חיפוש.
4. עדכון ה-`useEffect` ב-`App.jsx` לניהול דינמי של תגית ה-Canonical ועדכון כותרות הדפים במעברי דפים.
5. הוספת טסט ייעודי ב-`App.spec.jsx` לאימות עדכון ה-Canonical.

**Tech Stack:** React, React Router, Vitest.

---

### Task 1: עדכון קובצי Sitemap ו-Robots

**Files:**
- Modify: `public/sitemap.xml`
- Modify: `public/robots.txt`

- [ ] **Step 1: עדכון הקישורים ב-sitemap.xml**

שנה את כל מופעי הכתובת `https://ozora-2026.vercel.app` לכתובת החדשה `https://ozora-2026-taupe.vercel.app`.

תוכן מעודכן של `public/sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://ozora-2026-taupe.vercel.app/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://ozora-2026-taupe.vercel.app/timetable</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://ozora-2026-taupe.vercel.app/map</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://ozora-2026-taupe.vercel.app/guide</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://ozora-2026-taupe.vercel.app/favorites</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

- [ ] **Step 2: עדכון sitemap בתוך robots.txt**

שנה את נתיב ה-Sitemap ב-`public/robots.txt`:
```text
User-agent: *
Allow: /
Sitemap: https://ozora-2026-taupe.vercel.app/sitemap.xml
```

- [ ] **Step 3: ביצוע Commit**

```bash
git add public/sitemap.xml public/robots.txt
git commit -m "seo: update sitemap and robots with canonical domain"
```

---

### Task 2: עדכון מטא-טאגס וסכמות JSON-LD ב-index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: הוספת תגיות head וסכמות JSON-LD מורחבות**

שנה את החלק של ה-`<head>` ב-`index.html` כדי לכלול כותרת ודסקריפשן משופרים, תגית קנונית סטטית, וסכמות `FAQPage` ו-`MusicFestival` מעודכנות.

החלף את ה-`<head>` הישן:
```html
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ozora Festival 2026 Timetable & Map - Cosmic Companion</title>
    <meta name="description" content="Ozora Festival 2026 interactive timetable, offline map, custom schedule planner, and cosmic festival guide. Works 100% offline. / לוח הופעות אוזורה 2026 ומפת אופליין." />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://ozora-2026-taupe.vercel.app/" />
    <meta property="og:title" content="Ozora Festival 2026 Timetable & Map - Cosmic Companion" />
    <meta property="og:description" content="Ozora Festival 2026 interactive timetable, offline map, custom schedule planner, and cosmic festival guide. Works 100% offline. / לוח הופעות אוזורה 2026 ומפת אופליין." />
    <meta property="og:image" content="/ozora_banner.png" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://ozora-2026-taupe.vercel.app/" />
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
      "image": "https://ozora-2026-taupe.vercel.app/ozora_banner.png"
    }
    </script>
  </head>
```

בתוכן הבא:
```html
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ozora 2026 Lineup, Timetable & Map | לוח הופעות וליינאפ אוזורה 2026</title>
    <meta name="description" content="לוח ההופעות והליינאפ המלא והמעודכן של פסטיבל אוזורה 2026. כולל מפה אינטראקטיבית אופליין לניווט בבמות, הרכבת לוז אישי וחיפוש אמנים. / Complete and updated Ozora Festival 2026 timetable, lineup, offline map and cosmic survival guide." />
    <link rel="canonical" href="https://ozora-2026-taupe.vercel.app/" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://ozora-2026-taupe.vercel.app/" />
    <meta property="og:title" content="Ozora 2026 Lineup, Timetable & Map | לוח הופעות וליינאפ אוזורה 2026" />
    <meta property="og:description" content="לוח ההופעות והליינאפ המלא והמעודכן של פסטיבל אוזורה 2026. כולל מפה אינטראקטיבית אופליין לניווט בבמות, הרכבת לוז אישי וחיפוש אמנים. / Complete and updated Ozora Festival 2026 timetable, lineup, offline map and cosmic survival guide." />
    <meta property="og:image" content="/ozora_banner.png" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://ozora-2026-taupe.vercel.app/" />
    <meta name="twitter:title" content="Ozora 2026 Lineup, Timetable & Map | לוח הופעות וליינאפ אוזורה 2026" />
    <meta name="twitter:description" content="לוח ההופעות והליינאפ המלא והמעודכן של פסטיבל אוזורה 2026. כולל מפה אינטראקטיבית אופליין לניווט בבמות, הרכבת לוז אישי וחיפוש אמנים." />
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
      "image": "https://ozora-2026-taupe.vercel.app/ozora_banner.png"
    }
    </script>

    <!-- FAQ Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "מתי מתקיים פסטיבל אוזורה 2026?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "פסטיבל אוזורה 2026 יתקיים בין התאריכים 25 ביולי ל-3 באוגוסט 2026 בדאדפוסטה (Dádpuszta), הונגריה."
          }
        },
        {
          "@type": "Question",
          "name": "איפה אפשר למצוא את הליינאפ ולוח ההופעות המלא של אוזורה 2026?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "לוח ההופעות המלא והמעודכן ביותר של אוזורה 2026 זמין ישירות בדף הבית של האתר שלנו עם אפשרות חיפוש מתקדמת וסינון לפי ימים ובמות."
          }
        },
        {
          "@type": "Question",
          "name": "האם מפת פסטיבל אוזורה והלו"ז עובדים ללא אינטרנט (אופליין)?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "כן! האתר שלנו נבנה כאפליקציית PWA מתקדמת המאפשרת להוריד את כל המפות ולוח ההופעות ישירות לנייד, והם עובדים 100% במצב אופליין בשטח הפסטיבל שבו אין קליטה."
          }
        },
        {
          "@type": "Question",
          "name": "איך יוצרים לוח הופעות אישי לפסטיבל?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "פשוט נכנסים ללוח ההופעות באתר, לוחצים על כוכב ליד האמנים שאתם רוצים לראות, והם יתווספו אוטומטית לעמוד 'הלוח שלי' (Favorites) המאפשר לכם לראות את הלו\"ז המותאם שלכם."
          }
        }
      ]
    }
    </script>
  </head>
```

- [ ] **Step 2: ביצוע Commit**

```bash
git add index.html
git commit -m "seo: update static meta tags and add FAQ structured data schema in index.html"
```

---

### Task 3: הוספת תוכן Fallback סטטי ב-index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: כתיבת תוכן ה-fallback הסטטי בתוך `<div id="root">`**

החלף את השורה הבאה ב-`index.html`:
```html
    <div id="root"></div>
```

בתוכן הסטטי הבא (עשיר במילות מפתח ואמנים מובילים):
```html
    <div id="root">
      <!-- SEO Fallback Content (will be hydrated by React) -->
      <div style="padding: 20px; font-family: sans-serif; max-width: 800px; margin: 0 auto; color: #111; line-height: 1.6;">
        <header>
          <h1>Ozora 2026 Lineup, Timetable & Map | לוח הופעות וליינאפ אוזורה 2026</h1>
          <p>המדריך הקוסמי והלו"ז האינטראקטיבי המלא לפסטיבל אוזורה 2026 (Dádpuszta, הונגריה, 25 ביולי - 3 באוגוסט 2026). מפה אופליין מלאה לניווט, חיפוש אמנים וניהול הופעות מועדפות.</p>
        </header>
        
        <nav style="margin: 20px 0;">
          <a href="/timetable" style="margin-right: 15px;">לוח הופעות (Timetable)</a>
          <a href="/map" style="margin-right: 15px;">מפה אופליין (Map)</a>
          <a href="/guide" style="margin-right: 15px;">מדריך פסטיבל (Guide)</a>
          <a href="/favorites">הלוח שלי (Favorites)</a>
        </nav>

        <section style="margin-top: 30px;">
          <h2>Ozora Festival 2026 Stages & Lineup | במות ואמנים מרכזיים באוזורה</h2>
          <p>לוח ההופעות המלא מחולק לפי במות הפסטיבל. מצאו מתי מופיעים האמנים האהובים עליכם:</p>
          
          <article style="margin-bottom: 20px;">
            <h3>Main Stage (הבמה המרכזית)</h3>
            <p><strong>אמנים בולטים:</strong> Vibrasphere, X-Dream, Domestic, Ace Ventura, Astrix, Tristan, Alpha Portal, Liquid Soul, Carbon Based Lifeforms, Solar Fields, Entheogenic.</p>
          </article>
          
          <article style="margin-bottom: 20px;">
            <h3>Pumpui Stage (פומפוי)</h3>
            <p><strong>אמנים בולטים:</strong> Switch Nollie & Tsu, Siblicity, Zagi, DJ Reload, Mankind, Gorovich, Captain Hook.</p>
          </article>

          <article style="margin-bottom: 20px;">
            <h3>The Dome (הדום)</h3>
            <p><strong>אמנים בולטים:</strong> Carbon Based Lifeforms, Solar Fields, Henty, Sync24, Circular, Aes Dana, Vibrasphere.</p>
          </article>

          <article style="margin-bottom: 20px;">
            <h3>Dragon Nest (קן הדרקון)</h3>
            <p>הופעות חיות, מוזיקה אתנית, פולק ופרויקטים אקוסטיים מכל העולם.</p>
          </article>
        </section>

        <section style="margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px;">
          <h2>שאלות נפוצות - FAQ אוזורה 2026</h2>
          
          <div style="margin-bottom: 15px;">
            <h3>מתי מתקיים פסטיבל אוזורה 2026?</h3>
            <p>פסטיבל אוזורה 2026 יתקיים בין התאריכים 25 ביולי ל-3 באוגוסט 2026 בדאדפוסטה (Dádpuszta), הונגריה.</p>
          </div>
          
          <div style="margin-bottom: 15px;">
            <h3>איפה אפשר למצוא את הליינאפ ולוח ההופעות המלא של אוזורה?</h3>
            <p>לוח ההופעות המלא והמעודכן ביותר של אוזורה 2026 זמין ישירות בדף הבית של האתר שלנו עם אפשרות חיפוש מתקדמת וסינון לפי ימים ובמות.</p>
          </div>
          
          <div style="margin-bottom: 15px;">
            <h3>האם מפת פסטיבל אוזורה והלו"ז עובדים ללא אינטרנט (אופליין)?</h3>
            <p>כן! האתר שלנו נבנה כאפליקציית PWA מתקדמת המאפשרת להוריד את כל המפות ולוח ההופעות ישירות לנייד, והם עובדים 100% במצב אופליין בשטח הפסטיבל שבו אין קליטה.</p>
          </div>

          <div style="margin-bottom: 15px;">
            <h3>איך יוצרים לוח הופעות אישי לפסטיבל?</h3>
            <p>פשוט נכנסים ללוח ההופעות באתר, לוחצים על כוכב ליד האמנים שאתם רוצים לראות, והם יתווספו אוטומטית לעמוד "הלוח שלי" (Favorites) המאפשר לכם לראות את הלו"ז המותאם שלכם.</p>
          </div>
        </section>
        
        <footer style="margin-top: 40px; font-size: 0.9em; color: #666;">
          <p>© 2026 Ozora Cosmic Companion. כל הזכויות שמורות. קידום פסטיבל אוזורה בישראל ובעולם.</p>
        </footer>
      </div>
    </div>
```

- [ ] **Step 2: ביצוע Commit**

```bash
git add index.html
git commit -m "seo: add rich HTML fallback for search engine crawlers in index.html"
```

---

### Task 4: הוספת כתובות קנוניות דינמיות ושיפור כותרות דפים ב-App.jsx

**Files:**
- Modify: `src/App.jsx:91-152`

- [ ] **Step 1: הוספת לוגיקת Canonical דינמית ועדכון כותרות דפים ב-useEffect**

עדכן את ה-`useEffect` ב-`src/App.jsx` כדי להגדיר כותרות דפים מוכוונות מילות מפתח, לשנות את ה-meta tag, ולהזריק/לעדכן תגית `<link rel="canonical">` תואמת לנתיב הנוכחי בדפדפן.

החלף את ה-`useEffect` הקיים:
```javascript
  useEffect(() => {
    let pageTitleEnglish = 'Timetable';
    let metaDescText = 'Complete Ozora Festival 2026 timetable. Search artists, filter by stages and days, and plan your schedules.';
    
    const isHe = lang === 'he';

    if (location.pathname.startsWith('/favorites')) {
      pageTitleEnglish = 'My Schedule';
      metaDescText = isHe 
        ? 'לוח ההופעות האישי שלי לפסטיבל אוזורה 2026. סמן אמנים בכוכב כדי לתכנן את הלוז שלך.' 
        : 'My custom schedule for Ozora Festival 2026. Star your favorite artists to stay coordinated.';
    } else if (location.pathname.startsWith('/map')) {
      pageTitleEnglish = 'Map';
      metaDescText = isHe 
        ? 'מפה אינטראקטיבית אופליין של פסטיבל אוזורה 2026 עם אפשרות לסימון מיקום האוהל וניווט לבמות.' 
        : 'Interactive offline map of Ozora Festival 2026. View stages, navigate, and pin your campsite.';
    } else if (location.pathname.startsWith('/guide')) {
      pageTitleEnglish = 'Guide';
      metaDescText = isHe 
        ? 'המדריך המלא למבקר בפסטיבל אוזורה 2026 - המלצות, טיפים, צ\'ק ליסט ציוד וכל מה שצריך לדעת.' 
        : 'The ultimate survival guide for Ozora Festival 2026 with packing checklist, tips, and guidelines.';
    } else {
      pageTitleEnglish = 'Timetable';
      metaDescText = isHe 
        ? 'לוח הופעות מלא ומפורט של פסטיבל אוזורה 2026 עם חיפוש אמנים וסינון לפי ימים ובמות.' 
        : 'Complete Ozora Festival 2026 timetable. Search artists, filter by stages and days, and plan your schedules.';
    }

    let pageTitle = pageTitleEnglish;
    if (isHe) {
      if (pageTitleEnglish === 'Timetable') pageTitle = 'לוח הופעות';
      else if (pageTitleEnglish === 'My Schedule') pageTitle = 'הלוח שלי';
      else if (pageTitleEnglish === 'Map') pageTitle = 'מפה';
      else if (pageTitleEnglish === 'Guide') pageTitle = 'מדריך';
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
      page_title: pageTitleEnglish
    });
  }, [location, lang]);
```

בתוכן הבא:
```javascript
  useEffect(() => {
    let pageTitleEnglish = 'Timetable';
    let metaDescText = 'Complete Ozora Festival 2026 timetable. Search artists, filter by stages and days, and plan your schedules.';
    
    const isHe = lang === 'he';

    if (location.pathname.startsWith('/favorites')) {
      pageTitleEnglish = 'My Schedule';
      metaDescText = isHe 
        ? 'לוח ההופעות האישי שלי לפסטיבל אוזורה 2026. סמן אמנים בכוכב כדי לתכנן את הלוז שלך.' 
        : 'My custom schedule for Ozora Festival 2026. Star your favorite artists to stay coordinated.';
    } else if (location.pathname.startsWith('/map')) {
      pageTitleEnglish = 'Map';
      metaDescText = isHe 
        ? 'מפה אינטראקטיבית אופליין של פסטיבל אוזורה 2026 עם אפשרות לסימון מיקום האוהל וניווט לבמות.' 
        : 'Interactive offline map of Ozora Festival 2026. View stages, navigate, and pin your campsite.';
    } else if (location.pathname.startsWith('/guide')) {
      pageTitleEnglish = 'Guide';
      metaDescText = isHe 
        ? 'המדריך המלא למבקר בפסטיבל אוזורה 2026 - המלצות, טיפים, צ\'ק ליסט ציוד וכל מה שצריך לדעת.' 
        : 'The ultimate survival guide for Ozora Festival 2026 with packing checklist, tips, and guidelines.';
    } else {
      pageTitleEnglish = 'Timetable';
      metaDescText = isHe 
        ? 'לוח הופעות מלא ומפורט של פסטיבל אוזורה 2026 עם חיפוש אמנים וסינון לפי ימים ובמות.' 
        : 'Complete Ozora Festival 2026 timetable. Search artists, filter by stages and days, and plan your schedules.';
    }

    let pageTitle = '';
    if (isHe) {
      if (pageTitleEnglish === 'Timetable') {
        pageTitle = 'לוח הופעות וליינאפ אוזורה 2026 | Timetable';
      } else if (pageTitleEnglish === 'My Schedule') {
        pageTitle = 'הלוח שלי - הלוס המותאם אישית באוזורה | Favorites';
      } else if (pageTitleEnglish === 'Map') {
        pageTitle = 'מפה אופליין וניווט במות באוזורה | Festival Map';
      } else if (pageTitleEnglish === 'Guide') {
        pageTitle = 'מדריך פסטיבל אוזורה 2026 וצ\'ק ליסט ציוד | Guide';
      }
    } else {
      if (pageTitleEnglish === 'Timetable') {
        pageTitle = 'Ozora 2026 Timetable & Lineup';
      } else if (pageTitleEnglish === 'My Schedule') {
        pageTitle = 'My Custom Schedule - Ozora 2026';
      } else if (pageTitleEnglish === 'Map') {
        pageTitle = 'Ozora 2026 Festival Map (Offline)';
      } else if (pageTitleEnglish === 'Guide') {
        pageTitle = 'Ozora 2026 Survival Guide & Checklist';
      }
    }

    document.title = pageTitle;

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

    // Update Dynamic Canonical Tag
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    const cleanPath = location.pathname === '/' ? '/timetable' : location.pathname;
    canonicalLink.setAttribute('href', `https://ozora-2026-taupe.vercel.app${cleanPath}`);

    trackEvent('page_view', {
      page_path: location.pathname,
      page_title: pageTitleEnglish
    });
  }, [location, lang]);
```

- [ ] **Step 2: ביצוע Commit**

```bash
git add src/App.jsx
git commit -m "seo: update dynamic page titles and canonical link tag in App.jsx"
```

---

### Task 5: עדכון טסטים והרצת בדיקות

**Files:**
- Modify: `src/App.spec.jsx`

- [ ] **Step 1: הוספת בדיקה לעדכון ה-Canonical link ב-App.spec.jsx**

הוסף את בדיקת ה-Canonical בסוף קובץ הבדיקות `src/App.spec.jsx`:

החלף את סוף הקובץ:
```javascript
    metaDesc = document.querySelector('meta[name="description"]');
    expect(metaDesc.getAttribute('content')).toContain('The ultimate survival guide');
  });
});
```

בתוכן הבא (הכולל את הבדיקה החדשה):
```javascript
    metaDesc = document.querySelector('meta[name="description"]');
    expect(metaDesc.getAttribute('content')).toContain('The ultimate survival guide');
  });

  it('should dynamically update the canonical link tag when switching tabs', () => {
    renderApp();
    
    // Select english
    fireEvent.click(screen.getByRole('button', { name: /English/i }));
    
    // Default /timetable should map to canonical /timetable
    let canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical).toBeTruthy();
    expect(canonical.getAttribute('href')).toBe('https://ozora-2026-taupe.vercel.app/timetable');

    // Go to guide
    const guideNavBtn = screen.getAllByRole('button', { name: /Guide/i })[0];
    fireEvent.click(guideNavBtn);
    
    canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical.getAttribute('href')).toBe('https://ozora-2026-taupe.vercel.app/guide');
  });
});
```

- [ ] **Step 2: הרצת בדיקות מקומית**

הפעל את הבדיקות כדי לוודא שהכול עובר בהצלחה:
```bash
npm run test
```
ודא שכל 6 הבדיקות עוברות ללא שגיאות.

- [ ] **Step 3: ביצוע Commit**

```bash
git add src/App.spec.jsx
git commit -m "test(seo): add unit test for dynamic canonical url updates"
```
