# MySchedule Feature Expansion — Design Spec

**Date:** 2026-06-21
**Core Constraint:** Near-zero internet at Ozora festival. All features must work offline after initial page load.

---

## 1. Offline PWA

**Goal:** App works fully offline after first visit.

**Implementation:**
- Add `vite-plugin-pwa` to generate service worker
- Precache: all JS/CSS bundles, timetable.json, fonts, icons
- Web app manifest: name "Ozora 2026", theme color, icons for home screen
- Install prompt banner (bilingual HE/EN) nudging users to "Add to Home Screen" before the festival
- Cache strategy: precache all at install time (app is static, no API calls)

**Success criteria:** Opening the app in airplane mode loads fully and shows the timetable + MySchedule with all data.

---

## 2. Board Management

### 2a. Priority Marking

**UX:** Tap to cycle priority on any favorited set: Must See → Want to See → Maybe → (remove priority)

**Visual:**
- **Must See:** Fire icon, bold card styling, orange/red accent
- **Want to See:** Star (current default favorite appearance)
- **Maybe:** Dimmed text, smaller visual weight

**Storage:** `localStorage` key `ozora_priorities` → `{ [setUniqueKey]: 'must' | 'want' | 'maybe' }`

**Sort behavior:** Within each day group in MySchedule timeline, sets sort: must → want → maybe → chronological within each tier.

**Filter:** Optional filter toggle at top of MySchedule to show only "Must See" sets.

### 2b. Personal Notes

**UX:** Tap note icon (or long-press) on a set card → inline text input, max 100 characters. Examples: "meet Dani here", "bring water", "front left speaker".

**Storage:** `localStorage` key `ozora_notes` → `{ [setUniqueKey]: "note text" }`

**Display:** Small text line under artist name in MySchedule timeline cards. Truncated with ellipsis if too long; full text visible in SetModal.

### 2c. Conflict Detection

**Logic:** For each day, scan all favorited sets. Two sets conflict if their time ranges overlap (start1 < end2 AND start2 < end1). Handle midnight-crossing sets (end time < start time = next day).

**Display:**
- Yellow warning badge on conflicting cards
- Text: "Overlaps with [Artist] by [X]min"
- Dedicated "Conflicts" summary section at top of MySchedule (only visible when conflicts exist)

**No server dependency.** Pure client-side time comparison.

---

## 3. Friend Features

### 3a. QR Code Sharing

**UX flow:**
1. User taps "Share" button on MySchedule
2. Share menu appears with 3 options:
   - "Copy Link" (existing behavior)
   - "Show QR Code" (new)
   - "Export Image" (new, see 3b)
3. "Show QR Code" opens a modal with a generated QR code
4. QR encodes the same `?share=` URL format already used by link sharing
5. Friend scans with phone camera → browser opens → app (already cached via PWA) loads and imports

**Library:** `qrcode` npm package (~15KB). Generates QR as canvas or SVG, fully client-side.

**Offline:** Works at festival because QR is just a data encoding — no network needed to display it. Friend's app needs to be already cached (installed as PWA before festival).

### 3b. Schedule Image Export

**What:** Generate a shareable PNG image of the user's personal schedule.

**Design:**
- Dark background card with festival-themed header ("My Ozora 2026 Schedule" / "הלוח שלי — אוזורה 2026")
- Sets grouped by day, each day as a section header
- Each set shows: artist name, stage (color-coded dot), time, priority icon
- Conflict warnings visible on conflicting sets
- Footer: "Made with ozora2026.app"
- Bilingual based on current language setting

**Tech:** `html2canvas` library. Renders a hidden/off-screen schedule DOM element to canvas, then converts to PNG blob for download or native share (via `navigator.share` if available).

**Sizing:** Optimized for Instagram/WhatsApp story dimensions (1080x1920) or standard share (1080x1080 square).

### 3c. Compare Schedules & Overlaps

**Import flow (improved):**
When a user opens a `?share=` link, instead of silently merging favorites, show an import modal:
> "Someone shared their schedule! [X sets]"
> **Options:**
> 1. "Import All to My Schedule" (current behavior, merge)
> 2. "Save as Friend's Schedule" (new — prompts for friend name, saves separately)
> 3. "Just View" (temporary view, no save)

**Storage:** `localStorage` key `ozora_friends` → `{ [friendName]: { sets: [setUniqueKeys], importedAt: timestamp } }`

**Friend Schedules section in MySchedule:**
- Collapsible section showing imported friends
- Each friend entry shows: name, number of sets, "View" / "Compare" / "Remove" actions

**Compare View:**
- Side-by-side or merged timeline showing both schedules
- Color coding: "Both of you" (green badge), "Only you" (your color), "Only friend" (gray/secondary)
- **Overlap highlights:** Sets both users favorited get a "shared pick" badge
- **Discovery:** Friend's unique picks shown as suggestions — tap to add to your schedule

**Max friends:** Soft limit of 10 imported friend schedules to keep localStorage manageable.

---

## 4. Technical Notes

### Dependencies to Add
- `vite-plugin-pwa` — service worker + manifest generation
- `qrcode` — QR code generation (~15KB)
- `html2canvas` — DOM-to-image rendering (~40KB)

### localStorage Schema (additions)
```
ozora_priorities: { [setUniqueKey]: 'must' | 'want' | 'maybe' }
ozora_notes: { [setUniqueKey]: string }
ozora_friends: { [friendName]: { sets: [setUniqueKey[]], importedAt: number } }
```

### Component Changes
- **MySchedule.jsx** — Add priority icons, notes display, conflict section, friend section
- **App.jsx** — Change share import flow to show modal instead of silent merge
- **New: ShareMenu.jsx** — Share options (link, QR, image)
- **New: QRCodeModal.jsx** — QR code display
- **New: ImportModal.jsx** — Friend schedule import dialog
- **New: CompareView.jsx** — Schedule comparison view
- **New: ScheduleImage.jsx** — Hidden DOM for image export rendering
- **SetModal.jsx** — Add notes input field
- **New: ConflictBanner.jsx** — Conflict detection display

### Offline Considerations
- All features are 100% client-side, no API calls
- QR sharing works phone-to-phone without internet
- Image export generates locally, share via native share sheet or download
- Friend comparison works from locally stored data
- PWA install prompt should be shown prominently before festival dates (before July 25, 2026)

---

## 5. Out of Scope

- Real-time sync between devices (requires server)
- Chat/messaging between friends
- Location sharing within festival
- Push notifications (requires server + service worker push API)
- User accounts / authentication
