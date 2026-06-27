# Artist Origin Flags Design

## Goal

Add country flags next to every artist name in the Ozora 2026 timetable, based on the official origin country of the artist, project, or listed collaboration. The feature should cover all unique artists in `src/data/timetable.json`, including duos, trios, and named collaborations, without changing the raw timetable artist names that are used for search, saved schedules, sharing, and analytics.

## Decisions

- Use the official origin country of the artist or project as the source of truth.
- For listed collaborations, include every country represented by the listed participants when reliable sources support the mapping.
- Store origin data outside `timetable.json` so future timetable imports do not overwrite curated metadata.
- Display flags as a visual enhancement only. If origin data is missing or marked for review, show the existing artist name without a flag.
- Keep the raw `set.artist` string unchanged everywhere.

## Data Model

Create `src/data/artistOrigins.json` as a curated mapping keyed by the exact artist string used in `timetable.json`.

Each entry should include:

- `countries`: an array of ISO 3166-1 alpha-2 country codes.
- `sources`: one or more source URLs used to verify the origin.
- `confidence`: one of `high`, `medium`, or `needs_review`. Entries with `high` or `medium` confidence may render flags; `needs_review` entries must not render flags.
- `notes`: optional short clarification for collaborations, aliases, or ambiguous cases.

Example:

```json
{
  "Astrix": {
    "countries": ["IL"],
    "sources": ["https://en.wikipedia.org/wiki/Astrix_(musician)"],
    "confidence": "high"
  },
  "Gaudi + Don Letts + Earl 16": {
    "countries": ["IT", "GB", "JM"],
    "sources": [
      "https://en.wikipedia.org/wiki/Gaudi_(musician)",
      "https://en.wikipedia.org/wiki/Don_Letts",
      "https://en.wikipedia.org/wiki/Earl_16"
    ],
    "confidence": "high",
    "notes": "Listed collaboration; countries represent each named participant."
  }
}
```

## Research Rules

Preferred sources are official artist pages, official festival pages, Discogs, MusicBrainz, Wikipedia, Bandcamp, Resident Advisor, and comparable artist biography pages. If multiple sources disagree, prefer official artist/project sources first, then music databases, then editorial pages.

Do not infer a country from a personal name, language, label, tour location, or social media activity alone. If a country cannot be verified confidently, keep the entry with an empty `countries` array and `confidence: "needs_review"` so coverage checks stay honest.

For collaborations:

- `Artist A & Artist B`, `Artist A + Artist B`, and `Artist A / Artist B` should include all verified countries for the listed artists.
- `feat.`, `pres.`, `meets`, and `in Dub` should be handled case by case according to how the lineup name represents the act.
- If a collaboration name is itself a known project with an official origin, use the project origin and document that choice in `notes`.

## Rendering

Create a shared `ArtistNameWithFlags` component that receives an artist name and optional layout hints. It reads the matching origin entry and renders the artist consistently in all timetable surfaces.

Display rules:

- One country: show the flag next to the artist name on the trailing side of the rendered text direction.
- Two countries: show one flag before the name and one flag after the name.
- Three or more countries: show the artist name on the primary line and a compact flag row below it.
- Missing data, empty `countries`, or `needs_review` confidence: show only the artist name.
- Duplicate countries should be removed before rendering.

The component should expose accessible labels for the flags, such as `Origin: Israel`, without adding visible explanatory text to the timetable.

## Integration Points

Replace direct artist-name rendering with the shared component in:

- `src/components/TimetableGrid.jsx`
- `src/components/SearchBar.jsx`
- `src/components/SetModal.jsx`
- `src/components/ChronologicalFeed.jsx`
- `src/components/MySchedule.jsx`
- `src/components/CompareView.jsx`
- `src/components/LiveStatusModal.jsx`
- `src/components/VenueMap.jsx` where current and next artists are shown

Generated calendar exports, saved schedule keys, analytics payloads, search indexing, and share URLs should continue to use the raw `set.artist` string.

## Validation And Tests

Add focused tests for:

- Every unique `artist` in `src/data/timetable.json` has an entry in `artistOrigins.json`, unless an explicit documented exception list is introduced.
- Every country code is valid ISO 3166-1 alpha-2 and can be converted to a flag.
- Duplicate countries are removed before display.
- `ArtistNameWithFlags` renders the one-country, two-country, three-plus-country, and missing-data cases.
- Existing search and saved-schedule behavior still use unchanged raw artist names.

## Non-Goals

- Do not translate country names into Hebrew or English visible labels.
- Do not change artist names in `timetable.json`.
- Do not add an origin filter or country browsing UI.
- Do not show uncertain countries as guessed flags.
- Do not refactor unrelated timetable, search, or map behavior.

## Rollout

Implement the data file and component first, then connect one display surface at a time. The first pass may include `needs_review` entries for artists whose origin cannot be verified quickly, but the final user-facing state should only show flags for entries with `high` or `medium` confidence and at least one verified country.
