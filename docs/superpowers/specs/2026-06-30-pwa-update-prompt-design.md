# Design Spec: PWA Update Prompt

**Date:** 2026-06-30
**Author:** AI Coding Assistant
**Status:** Under Review

---

## 1. Goal & Context

Users who save the Ozora 2026 web app to their home screen can remain on an old cached version after new deployments. The app already uses `vite-plugin-pwa`, Workbox, `registerType: 'autoUpdate'`, `skipWaiting`, and `clientsClaim`, but the React app does not currently surface update availability or give installed users a clear way to activate a fresh service worker.

The goal is to add a calm, non-blocking update prompt that appears when a newer version is available and the device has internet access. The prompt must let the user either update now or skip, so installed PWA users no longer need to delete and reinstall the app to receive updates.

## 2. Scope

### In Scope

- Detect when the PWA service worker has an update ready.
- Show a compact in-app update banner when a new version is available.
- Provide two actions: update now and skip.
- Reload the app only after the user chooses to update.
- Hide the banner after skip for the current browser session.
- Support Hebrew and English copy through the existing language system.
- Preserve offline-first behavior when no internet is available.
- Add focused tests for the update prompt behavior.

### Out of Scope

- Forcing automatic updates without user choice.
- Reworking the full offline caching strategy.
- Adding a modal or blocking update screen.
- Migrating user data between incompatible schema versions.
- Changing the install prompt behavior unless a small shared PWA helper is needed.

## 3. UX Design

The update UI should be a small banner, not a modal. It can use the existing visual language of the install prompt and other compact notices. It should be visible enough for home-screen users to notice, but it must not block timetable browsing, map usage, schedule editing, or guide reading.

Suggested copy:

- Hebrew title: `גרסה חדשה זמינה`
- Hebrew body: `אפשר לעדכן עכשיו כדי לקבל את השינויים האחרונים.`
- Hebrew primary action: `עדכן עכשיו`
- Hebrew secondary action: `דלג`
- English title: `A new version is available`
- English body: `Update now to get the latest changes.`
- English primary action: `Update now`
- English secondary action: `Skip`

When the user taps `דלג` / `Skip`, the banner disappears for the current session. On a later app launch, if the same or another service worker update is still waiting, the app may show the banner again. This keeps the prompt useful without repeatedly interrupting the same visit.

## 4. Technical Design

### 4.1 Service Worker Registration

The app should explicitly register the PWA service worker from application code instead of relying only on injected registration. Use the supported `virtual:pwa-register/react` or `virtual:pwa-register` API from `vite-plugin-pwa` so React can subscribe to update state.

The registration should keep the existing auto-update posture:

- The browser checks for updated service worker assets.
- A waiting update is detected by React state.
- The app does not reload until the user confirms.
- Confirming calls the update helper with reload enabled.

### 4.2 Update Prompt Component

Add a small `PWAUpdatePrompt` component or equivalent focused unit. Its responsibilities:

- Subscribe to update availability.
- Render nothing when no update is available.
- Render nothing after the user skips during the current session.
- Render localized banner copy when an update is ready.
- Call the update helper when the user chooses `Update now`.
- Hide itself if the update completes or the page reloads.

The component should be mounted near existing global notices in `App.jsx`, close to `InstallPrompt`, so it is available across tabs.

### 4.3 Skip State

Use `sessionStorage` for skip state, for example `ozora_pwa_update_skipped`. Session-level skip is intentional:

- It respects the user's current flow.
- It avoids burying an important update forever.
- It does not conflict with offline usage.

If `sessionStorage` is unavailable, falling back to component state is acceptable.

### 4.4 Offline Behavior

When the device is offline, update checks will not find a newer service worker. The prompt should stay hidden and the app should continue to work from cache. If an update was already detected before the connection dropped, tapping update may fail or be delayed by the browser; the app should leave the current version usable and avoid clearing local user data.

## 5. Component Boundaries

Recommended units:

- `src/components/PWAUpdatePrompt.jsx`: presentation and user actions.
- A small helper or hook only if needed to isolate `vite-plugin-pwa` registration behavior.
- Translation additions in the existing `translations` structure.
- CSS colocated with existing global banner styles in `src/index.css` or the project's current global styling file.

The component should not own install prompting, analytics consent, timetable data, map state, favorites, or service worker cache naming. Keeping it narrow makes update behavior easy to test and adjust.

## 6. Error Handling & Edge Cases

- If service workers are unsupported, render nothing.
- If update registration fails, render nothing and keep the current app usable.
- If the user skips, suppress the banner for the current session.
- If the user updates, reload only through the PWA update helper so the waiting service worker activates correctly.
- If a reload happens while the user has local edits, existing `localStorage`-backed data should remain intact.
- If the app is opened offline, no update prompt appears.

## 7. Verification Plan

Automated checks:

- Component test: no banner when no update is available.
- Component test: localized Hebrew and English copy appears when an update is available.
- Component test: `Skip` hides the banner and records session skip.
- Component test: `Update now` calls the registered update helper.

Manual checks:

1. Build the app and serve it as a PWA.
2. Install or open it from the home screen.
3. Deploy or simulate a new build with changed service worker assets.
4. Reopen with internet: verify the update banner appears.
5. Tap `דלג`: verify the banner disappears and the app remains usable.
6. Reopen in a new session: verify the update can be offered again if still waiting.
7. Tap `עדכן עכשיו`: verify the app reloads into the new version.
8. Open while offline: verify no update prompt blocks usage.
