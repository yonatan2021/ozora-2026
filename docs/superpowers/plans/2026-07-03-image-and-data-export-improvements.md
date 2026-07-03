# Image and Data Export Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve image export sharpness (Retina/High-DPI support), add visual themes and procedural sacred geometry backgrounds, embed dynamic QR codes in the shared image, add lineup CSV export & printing, and enable exporting only checked items in the equipment list.

**Architecture:** Use high-DPI scaling (2.5x multiplier) in the HTML5 Canvas context. Render the background dynamically with mathematical vector patterns (sacred geometry) and custom gradient themes. Query `document.fonts.ready` before rendering. Update CSV utility scripts to handle filters and lineups, and add CSS print media styles.

**Tech Stack:** React 19, HTML5 Canvas, Vitest, CSS Media Queries, `qrcode` library.

---

### Task 1: Add Lineup CSV Export Utility
**Files:**
- Modify: `src/utils/exportImage.js`
- Test: `src/utils/exportImage.spec.js`

- [ ] **Step 1: Implement exportScheduleToCsv function**
  Add the CSV generator function at the end of `src/utils/exportImage.js`:
  ```javascript
  export function exportScheduleToCsv({ groupedByDay, priorities, lang }) {
    const isHe = lang === 'he';
    let csvContent = isHe
      ? "יום,תאריך,שעה,אמן,במה,עדיפות\n"
      : "Day,Date,Time,Artist,Stage,Priority\n";

    const DAY_DATES = {
      "Warmup Sat": "25/7", "Warmup Sun": "26/7", "DAY 1": "27/7", "DAY 2": "28/7",
      "DAY 3": "29/7", "DAY 4": "30/7", "DAY 5": "31/7", "DAY 6": "1/8", "DAY 7": "2/8"
    };

    const PRIORITY_LABELS = {
      he: { must: 'חובה', want: 'רוצה', maybe: 'אולי' },
      en: { must: 'Must', want: 'Want', maybe: 'Maybe' }
    };

    for (const [day, sets] of Object.entries(groupedByDay)) {
      const dateStr = DAY_DATES[day] || '';
      for (const set of sets) {
        const key = `${set.id}_${set.start}`; // getSetUniqueKey equivalent or similar
        const priorityVal = priorities[key] || '';
        const priorityText = PRIORITY_LABELS[lang === 'he' ? 'he' : 'en'][priorityVal] || '';

        const artistEsc = set.artist.replace(/"/g, '""');
        const stageEsc = set.stage.replace(/"/g, '""');
        const timeStr = `${set.start}-${set.end}`;

        csvContent += `"${day}","${dateStr}","${timeStr}","${artistEsc}","${stageEsc}","${priorityText}"\n`;
      }
    }

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ozora-2026-schedule.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  ```

- [ ] **Step 2: Commit changes**
  Run:
  ```bash
  git add src/utils/exportImage.js
  git commit -m "feat: add exportScheduleToCsv utility"
  ```

---

### Task 2: High-DPI Scaling and Font Verification
**Files:**
- Modify: `src/utils/exportImage.js`
- Modify: `src/utils/exportEquipmentImage.js`

- [ ] **Step 1: Update exportScheduleAsImage to use 2.5x scaling**
  Modify canvas setup in `src/utils/exportImage.js` to wait for fonts and scale the context:
  ```javascript
  // Add font load wait at the top of exportScheduleAsImage
  if (document.fonts) {
    await document.fonts.ready;
  }

  const SCALE_FACTOR = 2.5;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH * SCALE_FACTOR;
  canvas.height = estimatedHeight * SCALE_FACTOR;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE_FACTOR, SCALE_FACTOR);
  ```

- [ ] **Step 2: Update exportEquipmentImageAsPng to use 2.5x scaling**
  Modify canvas setup in `src/utils/exportEquipmentImage.js`:
  ```javascript
  if (document.fonts) {
    await document.fonts.ready;
  }

  const SCALE_FACTOR = 2.5;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH * SCALE_FACTOR;
  canvas.height = estimatedHeight * SCALE_FACTOR;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE_FACTOR, SCALE_FACTOR);
  ```

- [ ] **Step 3: Commit changes**
  Run:
  ```bash
  git add src/utils/exportImage.js src/utils/exportEquipmentImage.js
  git commit -m "feat: implement high-DPI scaling and font load checks for canvas exports"
  ```

---

### Task 3: Background Themes and Sacred Geometry
**Files:**
- Modify: `src/utils/exportImage.js`
- Modify: `src/utils/exportEquipmentImage.js`

- [ ] **Step 1: Add drawSacredGeometry function to exportImage.js and exportEquipmentImage.js**
  Define the shared procedural background generator:
  ```javascript
  function drawSacredGeometry(ctx, w, h, theme) {
    const isDay = theme === 'theme-day';
    ctx.save();
    ctx.strokeStyle = isDay ? 'rgba(160, 120, 200, 0.08)' : 'rgba(140, 80, 220, 0.12)';
    ctx.lineWidth = 1;

    // Draw interlocking circles (Flower of Life style) at top and bottom
    const centers = [
      { x: w / 2, y: h * 0.25 },
      { x: w / 2, y: h * 0.75 }
    ];

    for (const c of centers) {
      const radius = 180;
      // Center circle
      ctx.beginPath();
      ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Outer rings and spokes
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const rx = c.x + radius * Math.cos(angle);
        const ry = c.y + radius * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(rx, ry, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  ```

- [ ] **Step 2: Add color theme gradients based on selected activeThemeClass**
  Modify `drawCosmicBackground` to accept a theme parameter:
  ```javascript
  function drawCosmicBackground(ctx, w, h, theme = 'theme-night') {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (theme === 'theme-day') {
      grad.addColorStop(0, '#faf8f5');
      grad.addColorStop(1, '#f2ede4');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    } else if (theme === 'theme-sunset') {
      grad.addColorStop(0, '#18040a');
      grad.addColorStop(1, '#381008');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    } else if (theme === 'theme-sunrise') {
      grad.addColorStop(0, '#05091a');
      grad.addColorStop(1, '#082c30');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    } else {
      // theme-night / default
      grad.addColorStop(0, '#0a0518');
      grad.addColorStop(1, '#12082e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // Sacred geometry
    drawSacredGeometry(ctx, w, h, theme);
  }
  ```

- [ ] **Step 3: Update text colors dynamically based on activeThemeClass**
  Modify rendering text colors in both scripts to check `theme === 'theme-day'` and fall back to light text for dark themes.
  For example, in `exportImage.js`:
  ```javascript
  const textColor = theme === 'theme-day' ? '#332244' : '#eee0ff';
  const subtitleColor = theme === 'theme-day' ? 'rgba(51, 34, 68, 0.75)' : 'rgba(212, 184, 255, 0.7)';
  ```

- [ ] **Step 4: Commit changes**
  Run:
  ```bash
  git add src/utils/exportImage.js src/utils/exportEquipmentImage.js
  git commit -m "feat: implement gradients, theme settings, and sacred geometry backgrounds"
  ```

---

### Task 4: Dynamic QR Code Integration
**Files:**
- Modify: `src/utils/exportImage.js`

- [ ] **Step 1: Import qrcode and render it on exportScheduleAsImage**
  Import `QRCode` in `src/utils/exportImage.js`:
  ```javascript
  import QRCode from 'qrcode';
  ```
  Inside `exportScheduleAsImage`, fetch the QR code data URL and draw it in the footer:
  ```javascript
  // Generate QR Code data URL
  let qrImage = null;
  if (shareUrl) {
    try {
      const qrDataUrl = await QRCode.toDataURL(shareUrl, {
        margin: 1,
        width: 180,
        color: {
          dark: theme === 'theme-day' ? '#332244' : '#eee0ff',
          light: theme === 'theme-day' ? '#faf8f5' : '#0a0518'
        }
      });
      qrImage = await loadImage(qrDataUrl);
    } catch (e) {
      console.error('Failed to generate QR code', e);
    }
  }

  // Draw QR Image in the footer
  if (qrImage) {
    const qrSize = 90;
    const qrX = isHe ? PADDING : WIDTH - PADDING - qrSize;
    ctx.drawImage(qrImage, qrX, y - 20, qrSize, qrSize);

    ctx.fillStyle = theme === 'theme-day' ? 'rgba(51, 34, 68, 0.5)' : 'rgba(212, 184, 255, 0.4)';
    ctx.font = "400 10px 'Exo 2', 'Heebo', sans-serif";
    ctx.textAlign = isHe ? 'left' : 'right';
    ctx.fillText(isHe ? 'סרוק לייבוא הלוח' : 'Scan to import', qrX + qrSize / 2, y + qrSize - 10);
  }
  ```

- [ ] **Step 2: Commit changes**
  Run:
  ```bash
  git add src/utils/exportImage.js
  git commit -m "feat: embed dynamic QR codes in exported schedule images"
  ```

---

### Task 5: Equipment Checklist Filtering
**Files:**
- Modify: `src/utils/exportEquipmentData.js`
- Modify: `src/utils/exportEquipmentImage.js`

- [ ] **Step 1: Update exportEquipmentToCsv in exportEquipmentData.js**
  Add support for the `onlyChecked` parameter:
  ```javascript
  export function exportEquipmentToCsv(equipmentData, checkedMap, scope, onlyChecked = false) {
    // ... setup sections ...
    let csvContent = "סוג,קטגוריה,פריט,הערה,סטטוס\n";
    for (const sec of sections) {
      const sectionTitle = sec.data.title;
      for (const topic of sec.data.topics) {
        const topicHeading = topic.heading;
        for (const item of topic.items) {
          const checked = !!checkedMap[item.id];
          if (onlyChecked && !checked) continue; // Skip unchecked items
          
          const status = checked ? "סומן" : "לא סומן";
          const label = item.label.replace(/"/g, '""');
          const hint = (item.hint || '').replace(/"/g, '""');
          
          csvContent += `"${sectionTitle}","${topicHeading}","${label}","${hint}","${status}"\n`;
        }
      }
    }
    // ... download blob ...
  }
  ```

- [ ] **Step 2: Update exportEquipmentImageAsPng to filter items**
  Add support for the `onlyChecked` flag in `src/utils/exportEquipmentImage.js`. If true, only draw checked items and skip empty topics/sections:
  ```javascript
  export async function exportEquipmentImageAsPng({ shared, personal, checkedMap, onlyChecked = false, theme = 'theme-night' }) {
    // Filter sections based on checked items
    const sections = [];
    
    const filterSection = (section) => {
      if (!section) return null;
      const filteredTopics = section.topics.map(topic => {
        const filteredItems = topic.items.filter(item => !onlyChecked || checkedMap[item.id]);
        return { ...topic, items: filteredItems };
      }).filter(topic => topic.items.length > 0);
      
      if (filteredTopics.length === 0) return null;
      return { ...section, topics: filteredTopics };
    };

    const filteredShared = filterSection(shared);
    const filteredPersonal = filterSection(personal);
    const activeSections = [filteredShared, filteredPersonal].filter(Boolean);
    // ... render activeSections ...
  }
  ```

- [ ] **Step 3: Commit changes**
  Run:
  ```bash
  git add src/utils/exportEquipmentData.js src/utils/exportEquipmentImage.js
  git commit -m "feat: add checked-only item filters to equipment CSV and PNG exports"
  ```

---

### Task 6: Add UI Export Controls to Lineup Screen
**Files:**
- Modify: `src/components/MySchedule.jsx`
- Modify: `src/components/ShareMenu.jsx`

- [ ] **Step 1: Add new handlers in MySchedule.jsx**
  Implement handlers to export to CSV, print the schedule, and pass theme to export:
  ```javascript
  const handleExportCsv = () => {
    trackEvent('schedule_export_csv');
    exportScheduleToCsv({
      groupedByDay: displayGroupedByDay,
      priorities,
      lang
    });
  };

  const handlePrintSchedule = () => {
    trackEvent('schedule_print');
    window.print();
  };

  const handleExportImageWithTheme = async (themeStyle) => {
    try {
      await exportScheduleAsImage({
        groupedByDay: displayGroupedByDay,
        priorities,
        conflicts,
        lang,
        scheduleName,
        theme: themeStyle,
        shareUrl: buildShareUrl()
      });
      onShowToast(t.exportSuccess);
    } catch (err) {
      console.error('Export image failed', err);
    }
  };
  ```

- [ ] **Step 2: Update ShareMenu.jsx UI options**
  Update the dropdown layout with CSV, Print, and Theme selection options:
  ```javascript
  // Expand options dropdown inside ShareMenu.jsx with sections
  ```

- [ ] **Step 3: Commit changes**
  Run:
  ```bash
  git add src/components/MySchedule.jsx src/components/ShareMenu.jsx
  git commit -m "feat: add CSV export, print, and theme selections to MySchedule UI"
  ```

---

### Task 7: Add UI Export Controls to Equipment Checklist
**Files:**
- Modify: `src/components/EquipmentChecklist.jsx`

- [ ] **Step 1: Add checked-only filter handlers in EquipmentChecklist.jsx**
  Pass `onlyChecked` parameter to export calls:
  ```javascript
  const handleExportCsv = (scope, onlyChecked = false) => {
    setExportMenuOpen(false);
    trackEvent('equipment_export_csv', { scope, onlyChecked });
    exportEquipmentToCsv(equipmentData, checkedMap, scope, onlyChecked);
  };

  const handleExportImage = async (scope, onlyChecked = false) => {
    setExportMenuOpen(false);
    trackEvent('equipment_export_image', { scope, onlyChecked });
    await exportEquipmentImageAsPng({
      shared: scope === 'personal' ? null : equipmentData.shared,
      personal: scope === 'shared' ? null : equipmentData.personal,
      checkedMap,
      onlyChecked
    });
  };

  const handlePrint = (onlyChecked = false) => {
    setExportMenuOpen(false);
    trackEvent('equipment_print', { onlyChecked });
    if (onlyChecked) {
      document.body.classList.add('print-checked-only');
    } else {
      document.body.classList.remove('print-checked-only');
    }
    window.print();
  };
  ```

- [ ] **Step 2: Expand dropdown menu UI**
  Add items in `src/components/EquipmentChecklist.jsx` for exporting checked items only.

- [ ] **Step 3: Commit changes**
  Run:
  ```bash
  git add src/components/EquipmentChecklist.jsx
  git commit -m "feat: update equipment checklist export dropdown with checked-only options"
  ```

---

### Task 8: Print Media Styles
**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Implement print CSS rules for schedule and equipment**
  Add print stylesheet overrides to `src/index.css`:
  ```css
  @media print {
    /* Hide un-checked equipment if print-checked-only class is set */
    body.print-checked-only .equipment-item:not(:has(input:checked)) {
      display: none !important;
    }

    /* Print styles for My Schedule container */
    .my-schedule-container {
      display: block !important;
      color: #000000 !important;
      background: #ffffff !important;
    }
    /* Hide share buttons, edit names, conflict banners in print */
    .schedule-name-section, .share-menu-wrapper, .filter-must-btn, .fav-feed-header-row button {
      display: none !important;
    }
  }
  ```

- [ ] **Step 2: Commit changes**
  Run:
  ```bash
  git add src/index.css
  git commit -m "style: add print media overrides for schedule and equipment filters"
  ```
