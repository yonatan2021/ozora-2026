# Design Spec: Image and Data Export Improvements

Design document for improving the quality, appearance, themes, and capabilities of the image and data exports for both the Timetable Lineup and the Equipment Checklist.

## 1. Background & Goals
Currently, the timetable lineup and equipment checklist export high-contrast PNG images drawn directly to an HTML5 canvas. However, the current implementation has several issues:
- **Low Image Quality / Blurriness**: Images are rendered at 1:1 screen resolution, making them look blurry on high-DPI (Retina) screens.
- **Single Dark Theme**: The background and styling are hardcoded to a dark purple gradient, ignoring the user's active theme or preference.
- **Incomplete Equipment Filter**: Exporting equipment always exports all items, even if the user only wants to save/share the checked items.
- **Limited Lineup Export Options**: Unlike the equipment checklist (which supports Excel/CSV, Print/PDF, and JSON backups), the lineup only supports PNG image export.
- **Missed Sharing Potential**: Sharing a static PNG image makes it difficult for others to easily import the schedule.

### Goals
1. Add high-DPI scaling (2.5x) to canvas exports for razor-sharp image quality.
2. Support exporting images in the default Cosmic Night theme or the user's active app theme (Day, Sunset, Sunrise, Night).
3. Draw a procedural sacred geometry pattern in the background of exported images.
4. Integrate a scannable QR code on the schedule image that links directly to the user's online shareable timetable.
5. Support exporting only checked items in the equipment checklist for both CSV and PNG.
6. Add "Export to CSV" and "Print Schedule (PDF)" to the lineup interface.

---

## 2. Detailed Technical Spec

### A. High-Resolution & Font Loading
In `src/utils/exportImage.js` and `src/utils/exportEquipmentImage.js`, we will implement a high-resolution multiplier.
```javascript
const SCALE_FACTOR = 2.5;
const WIDTH = 1080;

// Set physical canvas dimensions
canvas.width = WIDTH * SCALE_FACTOR;
canvas.height = estimatedHeight * SCALE_FACTOR;

// Scale the context to draw in 1080px units
const ctx = canvas.getContext('2d');
ctx.scale(SCALE_FACTOR, SCALE_FACTOR);
```
To prevent default system fonts from rendering before custom fonts are loaded:
```javascript
if (document.fonts) {
  await document.fonts.ready;
}
```

---

### B. Themes & Color Palettes
We will define four distinct palettes to render the exported images.

| Theme Name | Background Gradient (Top to Bottom) | Secondary Elements / Glows | Text Main / Details | Separators |
| :--- | :--- | :--- | :--- | :--- |
| **Cosmic Night (Default)** | `#0a0518` to `#12082e` | `rgba(140, 80, 220, 0.16)` / `rgba(40, 180, 140, 0.10)` | `#eee0ff` / `rgba(212, 184, 255, 0.7)` | `rgba(140, 80, 220, 0.5)` |
| **Day Mode** | `#faf8f5` to `#f2ede4` | Soft warm gold `rgba(230, 210, 180, 0.12)` | `#332244` / `rgba(51, 34, 68, 0.75)` | `rgba(160, 120, 200, 0.4)` |
| **Sunset** | `#18040a` to `#381008` | `rgba(230, 96, 64, 0.15)` | `#ffe0e8` / `rgba(255, 200, 210, 0.7)` | `rgba(220, 100, 120, 0.5)` |
| **Sunrise** | `#05091a` to `#082c30` | `rgba(40, 180, 180, 0.12)` | `#e0f7ff` / `rgba(200, 240, 255, 0.7)` | `rgba(80, 200, 220, 0.5)` |

---

### C. Procedural Sacred Geometry Background
A function `drawSacredGeometry(ctx, w, h, theme)` will render concentric circles, dashed rings, and radial guide vectors simulating sacred geometry.
- For dark/colored themes: lines are drawn with thin glowing colors (`rgba(140, 80, 220, 0.12)`).
- For day theme: lines are drawn in muted sandy/lavender colors (`rgba(160, 120, 200, 0.08)`).
- Renders 3 concentric circles at `(w/2, h*0.25)` and `(w/2, h*0.75)` intersected by dashed spokes at 30-degree angles.

---

### D. QR Code Generation & Layout
Using the `qrcode` library, we will generate a high-contrast QR code from the user's `shareUrl` and render it in the image footer.
```javascript
import QRCode from 'qrcode';

const qrDataUrl = await QRCode.toDataURL(shareUrl, {
  margin: 1,
  width: 180, // High-res width
  color: {
    dark: theme === 'day' ? '#332244' : '#eee0ff',
    light: theme === 'day' ? '#faf8f5' : '#0a0518'
  }
});
```
- Placement: Bottom-left corner for RTL, Bottom-right corner for LTR.
- Dimensions: drawn at `90x90` CSS pixels (`225x225` actual pixels).
- Next to the QR code, a text tag will say: "סרוק לייבוא הלוח שלי" / "Scan to import my schedule".

---

### E. Equipment Checklist Filtering
1. **Export to CSV**:
   Update `exportEquipmentToCsv(equipmentData, checkedMap, scope, onlyChecked = false)` in `src/utils/exportEquipmentData.js`.
   If `onlyChecked` is true, filter out items that are not present/true in `checkedMap`.
2. **Export to Image**:
   Update `exportEquipmentImageAsPng({ shared, personal, checkedMap, onlyChecked = false })` in `src/utils/exportEquipmentImage.js`.
   If `onlyChecked` is true:
   - Filter items to only draw checked ones.
   - If a topic has 0 checked items, skip rendering the topic heading.
   - If a section has 0 checked items, skip rendering the section.
3. **UI Additions**:
   In `src/components/EquipmentChecklist.jsx`, expand the dropdown with options:
   - "ייצוא לאקסל (פריטים שסומנו בלבד)"
   - "ייצוא לתמונה (פריטים שסומנו בלבד)"
   - "הדפסת פריטים שסומנו בלבד" (attaches `.print-checked-only` class to document body prior to `window.print()`).

---

### F. Lineup CSV & Printing
1. **Export Lineup to CSV**:
   Add `exportScheduleToCsv({ groupedByDay, priorities, conflicts, lang })` in `src/utils/exportImage.js`.
   Columns: `יום,תאריך,שעה,אמן,במה,עדיפות,קונפליקטים,הערות` (or English equivalents).
   Prepend `\uFEFF` UTF-8 BOM.
2. **Print Schedule**:
   Add `@media print` CSS rules in `src/index.css` for `.my-schedule-container`:
   - Hide headers, footers, navigation, filters, buttons.
   - Convert list to elegant high-contrast black-and-white grid.
   - Keep RTL direction for Hebrew.

---

## 3. Verification Plan

### Automated Tests
- Run `npm run test` to verify existing components are unaffected.
- Add unit tests in `src/utils/exportEquipmentImage.spec.js` and `src/utils/exportImage.spec.js` (or add new ones) to test filtering options and parameters.

### Manual Verification
- Deploy changes to local dev server and open the UI.
- Verify image downloads (PNG) for both Lineup and Equipment in all four themes. Confirm images are sharp and crisp.
- Verify CSV export for both checked items only and all items. Open files in Excel to verify Hebrew text encoding.
- Open print preview (`Cmd+P` or print button) to confirm only the lists print in black-and-white.
