# Smart Search Upgrade Design

This document details the architectural and visual design for upgrading the festival timetable companion search system. The goal is to make the search system smart, bilingual, context-aware, and extremely useful for festival-goers on the ground.

## 1. Objectives & Use Cases

1.  **Crossover & Related Artist Discovery**: If a user searches for an artist (e.g. "Astrix"), they should find their side projects (e.g. "Alpha Portal"). If they search for a performer's real name (e.g. "Simon Posford"), they should see all of their projects ("Shpongle", "Younger Brother", "Hallucinogen").
2.  **Personal Notes & Coordination Notes Integration**: Users can query terms from their personal notes (e.g., "meet here") or friend coordination notes, and matching sets will appear.
3.  **Priority-Based Filtering**: Users can filter sets by their customized priority level ("Must See", "Want to See", "Maybe") using localized keywords.
4.  **Friend Schedule Querying**: Typing a friend's name (e.g., "Maya") lists all sets on that friend's custom schedule.
5.  **Low-friction Mobile Interaction (Quick Tags & History)**:
    *   Show recent searches.
    *   Show quick action tags for "Now Playing", "Next Up", stages, and genres so users do not have to type.
6.  **Clear Matching Context**: Display badges/labels in the search results highlighting the match reason (e.g., "Related to Astrix", "On Maya's schedule").

---

## 2. Technical Architecture

### A. Core Search Index Upgrade (`src/utils/search.js`)
We will refactor the search index logic to compile extra metadata per set.
*   **Data sources merged during indexing**:
    *   Timetable JSON (`timetable.json`)
    *   Artist Connections Database (`artistConnections.json`)
    *   Personal Notes (`ozora_notes` in `localStorage`)
    *   Friend Schedules & Coordination Notes (`ozora_friends` in `localStorage`)
    *   Priorities (`favorites` and priorities object)
*   **Match Criteria & Scores**:
    *   Direct artist name match: Score 150-200.
    *   Related artist / member match: Score 120. Reason: `related` (details: name of related artist).
    *   Personal note match: Score 100. Reason: `note` (details: matched note snippet).
    *   Friend schedule match: Score 110. Reason: `friend` (details: friend's name).
    *   Friend coordination note match: Score 100. Reason: `coordination_note` (details: friend's name and note snippet).
    *   Priority match: Score 90. Reason: `priority` (details: priority value).
    *   Stage or Genre match: Score 80.
*   **Time-aware terms**:
    *   Support special query tags: `"now playing"` / `"live"` (filtered to sets currently playing relative to `evalTime`), and `"next up"` / `"upcoming"` (sets starting in the next 3 hours).

### B. UI Component Refactoring (`src/components/SearchBar.jsx`)
*   **State Management**:
    *   `recentSearches` (loaded/saved to `localStorage` under `ozora_recent_searches`).
    *   `inputFocused` state to toggle history and quick tag rows.
*   **Quick Tags Row**:
    *   A scrollable chip container:
        *   `⚡ Now Playing` (applies query: `live`)
        *   `🕒 Next Up` (applies query: `upcoming`)
        *   `⭐ My Schedule` (applies query: `favorites` or similar)
        *   Stage chips: `🎪 Ozora`, `🎪 Pumpui`, `🎪 Dome`, etc.
        *   Genre chips: `🎵 Trance`, `🎵 Ambient`, `🎵 Chill`, `🎵 Techno`.
*   **Dropdown List Items**:
    *   Display `LIVE` badge with pulsing red dot if set is currently active.
    *   Add a secondary info line with contextual icons:
        *   🔗 *Related to [Artist Name]*
        *   📝 *My Note: "[Snippet]"*
        *   👥 *On [Friend Name]'s Schedule*
        *   🔥 *Priority: [Priority Label]*
    *   Highlight matched text in title/subtitle.

### C. Translations (`src/utils/lang.js`)
Add localized keys for:
*   `recentSearches`: "Recent Searches" / "חיפושים אחרונים"
*   `quickFilters`: "Quick Filters" / "סינון מהיר"
*   `nowPlayingTag`: "Now Playing" / "מנגנים עכשיו"
*   `nextUpTag`: "Next Up" / "הבאים בתור"
*   `myScheduleTag`: "My Schedule" / "הלוח שלי"
*   `matchRelated`: "Related to {name}" / "קשור ל-{name}"
*   `matchFriend`: "On {name}'s schedule" / "בלוח של {name}"
*   `matchNote`: "Matches note" / "תואם להערה"
*   `matchPriority`: "Priority: {level}" / "עדיפות: {level}"

---

## 3. Verification & Testing Plan

### Automated Tests
*   Extend `src/utils/search.spec.js` to assert:
    *   Phonetic and connection matching (searching members matches projects).
    *   Searching by notes and coordination notes.
    *   Searching by friend name retrieves their schedule.
    *   Correct scoring order.
*   Extend `src/components/SearchBar.spec.jsx` to test:
    *   Quick tags click behavior.
    *   Rendering of match reasons.
    *   Recent search additions and clears.

### Manual Verification
*   Verify rendering and styling under Day, Night, Sunrise, and Sunset themes.
    *   Check contrast and accessibility in high/low brightness.
*   Verify RTL alignment under Hebrew locale.
