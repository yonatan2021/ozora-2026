# URL Routing & Analytics Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cleanly decompose `App.jsx` into standalone pages and custom hooks, implement hash-based URL routing via React Router v6, synchronize URL search parameters with app state for deep sharing, and modernize the Google Analytics 4 event structure.

**Architecture:** 
- Extract navigation tabs into page components under `src/pages/`.
- Introduce custom hooks `useAppState`, `useUrlSync`, and `useTheme` to modularize state.
- Set up `HashRouter` and `<Routes>` to control tab switches, updating URL query parameters for sub-state (selected day, selected stage, active artist modal).
- Standardize the `trackEvent` wrapper to map old events to the new, product-focused event taxonomy.

**Tech Stack:** React 19, React Router v6 (`react-router-dom`), Google Analytics 4.

---

## Proposed Changes

### Setup & Libraries

#### [MODIFY] [package.json](file:///Users/yonig/Desktop/projects/Ozora-2026/package.json)
- Add `react-router-dom` to dependencies.

---

### Custom Hooks for State Separation

#### [NEW] [useAppState.js](file:///Users/yonig/Desktop/projects/Ozora-2026/src/hooks/useAppState.js)
- Manages shared local state such as `favorites`, `lang`, `pinnedTheme`, `toastMessage`, `notesVersion`, `isLiveModalOpen`, `pendingImport`.

#### [NEW] [useTheme.js](file:///Users/yonig/Desktop/projects/Ozora-2026/src/hooks/useTheme.js)
- Manages hour-based dynamic themes and locking of pinned themes.

#### [NEW] [useUrlSync.js](file:///Users/yonig/Desktop/projects/Ozora-2026/src/hooks/useUrlSync.js)
- Synchronizes search parameters (`?day=`, `?stage=`, `?set=`) with active selection, parsing kebab-case day values (e.g. `warmup-sat` <-> `Warmup Sat`).

---

### Routing & Pages

#### [NEW] [router.jsx](file:///Users/yonig/Desktop/projects/Ozora-2026/src/router.jsx)
- Configures routes (`/timetable`, `/favorites`, `/map`, `/guide`) using `<HashRouter>`.

#### [NEW] [TimetablePage.jsx](file:///Users/yonig/Desktop/projects/Ozora-2026/src/pages/TimetablePage.jsx)
- Holds timetable view mode toggles, stage lineup, and list/grid renderers.

#### [NEW] [FavoritesPage.jsx](file:///Users/yonig/Desktop/projects/Ozora-2026/src/pages/FavoritesPage.jsx)
- Renders the custom schedule checklist page.

#### [NEW] [MapPage.jsx](file:///Users/yonig/Desktop/projects/Ozora-2026/src/pages/MapPage.jsx)
- Wraps the leaflet map lazy load.

#### [NEW] [GuidePage.jsx](file:///Users/yonig/Desktop/projects/Ozora-2026/src/pages/GuidePage.jsx)
- Renders the guidebook content.

#### [MODIFY] [App.jsx](file:///Users/yonig/Desktop/projects/Ozora-2026/src/App.jsx)
- Refactored to act as layout wrapper providing routing contexts and menus.

#### [MODIFY] [main.jsx](file:///Users/yonig/Desktop/projects/Ozora-2026/src/main.jsx)
- Wrap root in `<RouterProvider router={router} />`.

---

### Analytics Update

#### [MODIFY] [analytics.js](file:///Users/yonig/Desktop/projects/Ozora-2026/src/utils/analytics.js)
- Remap old event structures and enforce standardized parameter logging.

---

## Tasks

### Task 1: Install React Router & Define Custom Hooks

**Files:**
- Modify: `package.json`
- Create: `src/hooks/useAppState.js`
- Create: `src/hooks/useTheme.js`
- Create: `src/hooks/useUrlSync.js`

- [ ] **Step 1: Install `react-router-dom` dependency**
  Run: `npm install react-router-dom@6`
- [ ] **Step 2: Create useAppState.js**
  Write the initial core state management hooks separating localStorage synchronization.
- [ ] **Step 3: Create useTheme.js**
  Write the dynamic time theme hooks.
- [ ] **Step 4: Create useUrlSync.js**
  Add state-to-URL matching logic with full query support.
- [ ] **Step 5: Verify tests and commit**
  Verify standard builds work.

---

### Task 2: Implement Page Extraction & Routing Setup

**Files:**
- Create: `src/pages/TimetablePage.jsx`
- Create: `src/pages/FavoritesPage.jsx`
- Create: `src/pages/MapPage.jsx`
- Create: `src/pages/GuidePage.jsx`
- Create: `src/router.jsx`
- Modify: `src/main.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create Page components**
  Move tab-specific elements from App.jsx to TimetablePage, FavoritesPage, MapPage, and GuidePage.
- [ ] **Step 2: Setup routing structure**
  Implement HashRouter mapping matching paths `/timetable`, `/favorites`, `/map`, `/guide`.
- [ ] **Step 3: Refactor App.jsx**
  Implement routing hook states and clear out massive UI rendering segments.
- [ ] **Step 4: Update main.jsx**
  Wire router into the DOM wrapper.
- [ ] **Step 5: Verify app loads and resolves router correctly**
  Run `npm run dev` and navigate manually through routes.

---

### Task 3: Redesign Google Analytics Wrapper & Custom Trackers

**Files:**
- Modify: `src/utils/analytics.js`
- Modify: `src/components/SetModal.jsx`
- Modify: `src/components/FooterInstallCTA.jsx`
- Modify: `src/components/EquipmentChecklist.jsx`
- Modify: other components containing `trackEvent`

- [ ] **Step 1: Revamp analytics.js event mapping**
  Include route-level automatic tracking and rename old keys dynamically.
- [ ] **Step 2: Modify SetModal.jsx analytics**
  Add duration tracker and correct naming definitions.
- [ ] **Step 3: Update EquipmentChecklist.jsx and FooterInstallCTA.jsx**
  Consolidate exports and installation prompts.
- [ ] **Step 4: Verify analytics schema matches requirements**
  Run GA unit tests (`npm test`) to ensure analytics definitions do not break.
- [ ] **Step 5: Commit changes**

---

## Verification Plan

### Automated Tests
- Run `npm test` after each key refactoring milestone.

### Manual Verification
- Access the app at `http://localhost:5173/#/timetable?day=day-1&stage=pumpui` and check if the proper filters apply automatically.
- Click an artist card, verify the URL appends `&set=<id>`. Copy and paste in a new tab, check if it opens directly to that modal.
- Open the Developer Tools console and confirm that custom GA events are logging offline events perfectly in development mode.
