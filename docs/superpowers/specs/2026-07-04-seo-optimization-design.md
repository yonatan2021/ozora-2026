# מפרט עיצוב קידום אתרים (SEO) - פסטיבל אוזורה 2026

מסמך זה מתאר את תוכנית העבודה לשיפור ה-SEO של האתר במטרה להוביל בתוצאות החיפוש של גוגל עבור ביטויים הקשורים לאוזורה ("אוזורה 2026", "ליינאפ אוזורה 2026", "לוח הופעות אוזורה", וכו').

## יעד
הגעה למקום הראשון בתוצאות החיפוש בגוגל (עבור קהל ישראלי ובינלאומי) עבור שאילתות הקשורות ללוח ההופעות, הליינאפ והמפה של אוזורה 2026, באמצעות התאמת המטא-דאטה, הוספת סכמות עשירות, עדכון מפת האתר, והזרקת תוכן סטטי עשיר במילות מפתח לאינדוקס מהיר.

---

## 1. כתובת קנונית (Canonical Domain) וקובצי שירות
הכתובת הראשית והקנונית של האתר תיקבע כ-`https://ozora-2026-taupe.vercel.app`.

### עדכונים נדרשים:
1. **[sitemap.xml](file:///Users/yonig/Desktop/projects/Ozora-2026/public/sitemap.xml)**:
   - החלפת כל המופעים של הכתובת הישנה (`https://ozora-2026.vercel.app`) בכתובת החדשה `https://ozora-2026-taupe.vercel.app`.
   - וידוא שכל הדפים הראשיים מופיעים במיפוי.
2. **[robots.txt](file:///Users/yonig/Desktop/projects/Ozora-2026/public/robots.txt)**:
   - עדכון הקישור של ה-Sitemap לכתובת החדשה.
3. **[index.html](file:///Users/yonig/Desktop/projects/Ozora-2026/index.html)**:
   - הוספת תגית קנונית סטטית ב-`<head>`:
     ```html
     <link rel="canonical" href="https://ozora-2026-taupe.vercel.app/" />
     ```

---

## 2. מטא-טאגס ב-index.html
שדרוג המטא-דאטה הסטטי ב-`<head>` של [index.html](file:///Users/yonig/Desktop/projects/Ozora-2026/index.html) כדי להתמקד במילות המפתח המובילות:
* **Title**: `Ozora 2026 Lineup, Timetable & Map | לוח הופעות וליינאפ אוזורה 2026`
* **Description**: `לוח ההופעות והליינאפ המלא והמעודכן של פסטיבל אוזורה 2026. כולל מפה אינטראקטיבית אופליין לניווט בבמות, הרכבת לוז אישי וחיפוש אמנים. / Complete and updated Ozora Festival 2026 timetable, lineup, offline map and cosmic survival guide.`
* **Open Graph Title / Image**: שמירה על העיצוב הקיים עם כיוונון כתובות ה-URL לכתובת הקנונית החדשה.

---

## 3. תוכן fallback סטטי בתוך `<div id="root">`
כדי להבטיח שרובוטים של מנועי חיפוש יקראו ויאנדקסו את התוכן מיד בחיבור הראשון (בלי להמתין להרצת JavaScript), נטמיע קוד HTML סמנטי ומפורט בתוך ה-`div` של `root` (שיתחלף מיד ברגע ש-React ייטען בדפדפן):

```html
<div id="root">
  <!-- SEO Static Fallback Content -->
  <header>
    <h1>Ozora 2026 Lineup, Timetable & Map | לוח הופעות וליינאפ אוזורה 2026</h1>
    <p>המדריך הקוסמי והלו"ז האינטראקטיבי המלא לפסטיבל אוזורה 2026 (Dádpuszta, הונגריה, 25 ביולי - 3 באוגוסט 2026). מפה אופליין מלאה לניווט, חיפוש אמנים וניהול הופעות מועדפות.</p>
  </header>

  <main>
    <section>
      <h2>Ozora Festival 2026 Stages & Lineup | במות ואמנים מרכזיים</h2>
      <p>לוח ההופעות המלא מחולק לפי במות הפסטיבל. מצאו מתי מופיעים האמנים האהובים עליכם:</p>
      
      <article>
        <h3>Main Stage (במה מרכזית)</h3>
        <p>Featured Artists: Vibrasphere, X-Dream, Domestic, Ace Ventura, Astrix, Tristan, Alpha Portal, Liquid Soul, Carbon Based Lifeforms, Solar Fields, Entheogenic.</p>
      </article>
      
      <article>
        <h3>Pumpui Stage (פומפוי)</h3>
        <p>Featured Artists: Switch Nollie & Tsu, Siblicity, Zagi, DJ Reload, Mankind, Gorovich, Captain Hook.</p>
      </article>

      <article>
        <h3>The Dome (הדום)</h3>
        <p>Featured Artists: Carbon Based Lifeforms, Solar Fields, Henty, Sync24, Circular, Aes Dana.</p>
      </article>

      <article>
        <h3>Dragon Nest (קן הדרקון)</h3>
        <p>Featured Artists: Live bands, traditional music, and world acoustic projects.</p>
      </article>
    </section>

    <section>
      <h2>שאלות נפוצות - FAQ אוזורה 2026</h2>
      <details open>
        <summary>מתי מתקיים פסטיבל אוזורה 2026?</summary>
        <p>פסטיבל אוזורה 2026 יתקיים בין התאריכים 25 ביולי ל-3 באוגוסט 2026 בדאדפוסטה (Dádpuszta), הונגריה.</p>
      </details>
      <details open>
        <summary>איפה אפשר למצוא את הליינאפ ולוח ההופעות המלא של אוזורה?</summary>
        <p>לוח ההופעות המלא והמעודכן ביותר של אוזורה 2026 זמין ישירות בדף הבית של האתר שלנו עם אפשרות חיפוש מתקדמת וסינון לפי ימים ובמות.</p>
      </details>
      <details open>
        <summary>האם מפת פסטיבל אוזורה והלו"ז עובדים ללא אינטרנט (אופליין)?</summary>
        <p>כן! האתר שלנו נבנה כאפליקציית PWA מתקדמת המאפשרת להוריד את כל המפות ולוח ההופעות ישירות לנייד, והם עובדים 100% במצב אופליין בשטח הפסטיבל שבו אין קליטה.</p>
      </details>
      <details open>
        <summary>איך יוצרים לוח הופעות אישי לפסטיבל?</summary>
        <p>פשוט נכנסים ללוח ההופעות באתר, לוחצים על כוכב ליד האמנים שאתם רוצים לראות, והם יתווספו אוטומטית לעמוד "הלוח שלי" (Favorites) המאפשר לכם לראות את הלו"ז המותאם שלכם.</p>
      </details>
    </section>
  </main>
  
  <footer>
    <p>© 2026 Ozora Cosmic Companion. כל הזכויות שמורות. קידום פסטיבל אוזורה בישראל ובעולם.</p>
  </footer>
</div>
```

---

## 4. נתונים מובנים (JSON-LD Structured Data)
בנוסף לסכמה הקיימת של `MusicFestival`, נשלב סכמת `FAQPage` כדי שגוגל יוכל להציג את השאלות הנפוצות ישירות בתוצאות החיפוש:

```html
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
      "name": "האם מפת פסטיבל אוזורה והלוז עובדים ללא אינטרנט (אופליין)?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "כן! האתר שלנו נבנה כאפליקציית PWA מתקדמת המאפשרת להוריד את כל המפות ולוח ההופעות ישירות לנייד, והם עובדים 100% במצב אופליין בשטח הפסטיבל שבו אין קליטה."
      }
    }
  ]
}
</script>
```

---

## 5. עדכוני מטא וכתובות קנוניות דינמיות ב-App.jsx
נעדכן את ה-`useEffect` ב-[src/App.jsx](file:///Users/yonig/Desktop/projects/Ozora-2026/src/App.jsx):
1. **כותרות דפים (document.title)**:
   - דף הבית / לוח הופעות: `Ozora 2026 Timetable & Lineup | לוח הופעות אוזורה`
   - מפה: `Ozora 2026 Festival Map | מפת פסטיבל אוזורה`
   - מדריך: `Ozora 2026 Survival Guide | מדריך פסטיבל אוזורה`
   - מועדפים: `My Custom Ozora 2026 Schedule | הלוח שלי`
2. **עדכון דינמי של תגית Canonical**:
   נכתוב פונקציית עזר שתעדכן את ה-`href` של תגית ה-canonical בהתאם לנתיב הנוכחי:
   ```javascript
   let canonicalLink = document.querySelector('link[rel="canonical"]');
   if (!canonicalLink) {
     canonicalLink = document.createElement('link');
     canonicalLink.setAttribute('rel', 'canonical');
     document.head.appendChild(canonicalLink);
   }
   canonicalLink.setAttribute('href', `https://ozora-2026-taupe.vercel.app${location.pathname}`);
   ```

---

## תוכנית בדיקה ואימות (Verification Plan)
1. **בדיקת מטא-תגיות**: הפעלת שרת הפיתוח מקומית ובדיקת ה-DOM כדי לוואק שתגית ה-Canonical והמטא משתנים נכון בעת מעבר בין דפים.
2. **בדיקת תקינות sitemap.xml ו-robots.txt**: קריאת הקבצים ישירות ואימות של הקישורים החדשים.
3. **הרצת בדיקות יחידה (Unit Tests)**: הרצת `npm run test` כדי לוודא שאין פגיעה בבדיקות הקיימות לעדכון המטא-תגיות.
