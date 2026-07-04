# URL Routing & Analytics Redesign

## Background

The Ozora 2026 app is a React/Vite SPA deployed on GitHub Pages. Currently there is no URL routing — all state lives in React state, making it impossible to share deep links to specific artists, days, or screens. Additionally, Google Analytics events use inconsistent naming that makes it hard to understand feature engagement and decide where to invest product effort.

This spec covers two interconnected changes:
1. Introducing hash-based URL routing (compatible with GitHub Pages, easy to migrate to Vercel later)
2. Redesigning the analytics event taxonomy to surface meaningful engagement signals

---

## Goals

- Any screen/filter/artist in the app can be shared via URL
- Arriving via a shared link opens the correct state (day, stage, set modal)
- GA4 events have consistent, readable names that reveal where users spend time and what they ignore
- App.jsx is split into focused, maintainable files

---

## Architecture

### Routing Library

**React Router v6 with `HashRouter`** — the industry standard. Uses `#` prefix so GitHub Pages serves `index.html` for all paths. Migration to Vercel later requires one change: `HashRouter` → `BrowserRouter`.

### URL Structure

All routes live under the hash (`/#/...`):

| Screen | URL Pattern | Notes |
|--------|------------|-------|
| Root redirect | `/#/` → `/#/timetable` | |
| Timetable | `/#/timetable` | default day, all stages |
| Timetable + day | `/#/timetable?day=day-1` | |
| Timetable + day + stage | `/#/timetable?day=day-1&stage=ozora-stage` | |
| Artist/Set modal | `/#/timetable?day=day-1&set=123` | modal overlay, not separate page |
| My Schedule | `/#/favorites` | |
| Venue Map | `/#/map` | |
| Festival Guide | `/#/guide` | |

Day names in the URL are kebab-cased versions of internal keys: `Warmup Sat` → `warmup-sat`, `DAY 1` → `day-1`.

**Why query params instead of path segments for day/stage?** Because day and stage are filters on a single view, not nested pages. Query params are easier to share partially and compose.

### URL Sync Strategy

The URL is the source of truth for navigation state. On mount, the app reads the URL and restores state (day, stage, set modal). On state change, the URL is updated via `useNavigate` / `setSearchParams`. The existing `?share=` import flow is preserved and migrated to this system.

---

## File Structure Changes

### New Files

```
src/
  router.jsx               # HashRouter + route definitions
  pages/
    TimetablePage.jsx      # Timetable tab content (extracted from App.jsx)
    FavoritesPage.jsx      # MySchedule tab content
    MapPage.jsx            # VenueMap tab content
    GuidePage.jsx          # FestivalGuide tab content
  hooks/
    useAppState.js         # favorites, lang, toast, pendingImport state
    useUrlSync.js          # reads/writes URL query params
    useTheme.js            # time-based theme logic
```

### Modified Files

- **`App.jsx`** — reduced to ~100 lines: router provider, shared state via hooks, navigation shell
- **`src/main.jsx`** — wraps App in HashRouter
- **`vite.config.js`** — no base path change needed (hash routing works as-is)

### Unchanged

All existing components remain in `src/components/`. No component API changes.

---

## Analytics Redesign

### Principle

Events should answer: "Which features do users actually use, and which are ignored?" Event names follow the pattern `noun_verb` (object first, then action).

### Renamed Events

| Old Name | New Name | Reason |
|----------|----------|--------|
| `tab_view` | `page_view` | GA4 recommended standard event |
| `select_day` | `timetable_filter_day` | Clear it's a filter action |
| `select_stage` | `timetable_filter_stage` | Clear it's a filter action |
| `select_view_mode` | `timetable_view_mode_change` | Noun-verb pattern |
| `guide_card_click` | `guide_section_open` | Describes what happens |
| `guide_topic_toggle` | `guide_section_expand` | Describes what happens |
| `guide_back_click` | removed | Redundant — captured by page_view |
| `map_show_on_map` | `map_stage_focus` | Shorter, clearer |
| `change_language` | `language_change` | Noun-verb pattern |
| `save_note` | `artist_note_save` | Scoped to artist context |
| `set_priority` | `artist_priority_set` | Scoped to artist context |
| `toggle_filter_must` | `schedule_filter_must` | Noun-verb pattern |
| `toggle_stage_accordion` | `stage_lineup_expand` | Describes what happens |
| `view_set_details` | `artist_modal_open` | Clearer what opens |

### Consolidated Events

| Old Events | New Event | New Param |
|------------|-----------|-----------|
| `equipment_export_csv`, `equipment_export_json`, `equipment_export_image`, `equipment_print` | `equipment_export` | `{ method: 'csv' / 'json' / 'image' / 'print' }` |
| `pwa_install_cta_view`, `pwa_install_cta_click`, `pwa_install_cta_result` | `pwa_install_cta` | `{ action: 'view' / 'click' / 'result', outcome? }` |

### New Events

| Event | Triggered When | Product Question It Answers |
|-------|---------------|----------------------------|
| `shared_link_opened` | User arrives via `?share=` param | How many shares convert to opens? |
| `deep_link_resolved` | URL contains day/stage/set params on load | Are deep links being shared and used? |
| `schedule_empty_state` | User opens favorites tab with 0 favorites | How many users never use My Schedule? |
| `artist_modal_close` | Set modal closes, with `{ duration_seconds }` | Do users read artist details or just dismiss? |

### Retained Events (no change)

`toggle_favorite`, `listen_music`, `share_schedule`, `import_schedule`, `save_friend`, `remove_friend`, `compare_friend`, `search_artist`, `select_search_result`, `add_to_calendar`, `cookie_consent`, `pwa_install`, `pwa_open_standalone`

---

## page_view Event Strategy

With React Router, each route change fires a `page_view` event:

```js
trackEvent('page_view', {
  page_path: '/#/timetable',
  page_title: 'Timetable'
})
```

This replaces the current `tab_view` event and makes GA4's built-in "Pages and screens" report work correctly.

---

## Verification Plan

### Automated
- Existing unit tests continue to pass (`npm test`)
- URL sync: navigate to `/#/timetable?day=day-2&stage=pumpui` → verify correct day and stage are selected on mount

### Manual
- Share a link to a specific set → verify modal opens on arrival
- Navigate between tabs → verify URL updates
- Reload on any URL → verify correct screen loads
- GA4 DebugView: fire each new event, verify it appears with correct params
- `?share=` import flow still works

---

## Migration Path to Vercel (Future)

1. Change `HashRouter` → `BrowserRouter` in `router.jsx`
2. Add `vercel.json` with catch-all rewrite to `/index.html`
3. Update `vite.config.js` `base` from `/ozora-2026/` to `/`
4. Done — no other code changes needed
