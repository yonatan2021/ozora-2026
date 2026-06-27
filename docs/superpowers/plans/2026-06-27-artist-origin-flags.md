# Artist Origin Flags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add verified country-origin flags beside artist names across the Ozora 2026 timetable without changing raw timetable artist strings.

**Architecture:** Keep curated origin metadata in `src/data/artistOrigins.json`, separate from `src/data/timetable.json`. Add small utility functions for country-code validation and flag conversion, then render artist names through a shared `ArtistNameWithFlags` component across timetable surfaces.

**Tech Stack:** React 19, Vite, Vitest, Testing Library, JSON data modules, CSS in `src/index.css`.

---

## File Structure

- Create `src/data/artistOrigins.json`: exact artist-name-to-origin mapping with `countries`, `sources`, `confidence`, and optional `notes`.
- Create `src/data/artistOrigins.spec.js`: validates coverage for every unique timetable artist and validates entry shape.
- Create `src/utils/countryFlags.js`: country-code allowlist, flag conversion, origin lookup, and render-shape helpers.
- Create `src/utils/countryFlags.spec.js`: unit tests for country utilities and origin lookup behavior.
- Create `src/components/ArtistNameWithFlags.jsx`: shared display component for one, two, and three-plus country layouts.
- Create `src/components/ArtistNameWithFlags.spec.jsx`: component rendering and accessibility tests.
- Modify `src/index.css`: shared flag and artist-name layout styles.
- Modify `src/components/TimetableGrid.jsx`: replace direct artist rendering in timetable cards.
- Modify `src/components/SearchBar.jsx`: replace direct artist rendering in search suggestions.
- Modify `src/components/SetModal.jsx`: replace modal artist title rendering.
- Modify `src/components/ChronologicalFeed.jsx`: replace feed artist rendering while preserving live indicator.
- Modify `src/components/MySchedule.jsx`: replace artist rendering in all schedule sections.
- Modify `src/components/CompareView.jsx`: replace comparison feed artist rendering.
- Modify `src/components/LiveStatusModal.jsx`: replace current and next artist rendering.
- Modify `src/components/VenueMap.jsx`: replace current and next artist rendering in venue popups.

## Task 1: Country Flag Utilities

**Files:**
- Create: `src/utils/countryFlags.js`
- Create: `src/utils/countryFlags.spec.js`

- [ ] **Step 1: Write failing utility tests**

Create `src/utils/countryFlags.spec.js`:

```js
import { describe, expect, it } from 'vitest';
import {
  countryCodeToFlag,
  getRenderableOrigin,
  isValidCountryCode,
  uniqueCountryCodes
} from './countryFlags';

describe('countryFlags utilities', () => {
  it('validates supported ISO country codes', () => {
    expect(isValidCountryCode('IL')).toBe(true);
    expect(isValidCountryCode('gb')).toBe(true);
    expect(isValidCountryCode('XX')).toBe(false);
    expect(isValidCountryCode('ISR')).toBe(false);
  });

  it('converts supported country codes to emoji flags', () => {
    expect(countryCodeToFlag('IL')).toBe('🇮🇱');
    expect(countryCodeToFlag('gb')).toBe('🇬🇧');
  });

  it('deduplicates and normalizes country codes while preserving order', () => {
    expect(uniqueCountryCodes(['il', 'GB', 'IL', ' jm '])).toEqual(['IL', 'GB', 'JM']);
  });

  it('returns null for missing or unreviewed origins', () => {
    expect(getRenderableOrigin(undefined)).toBeNull();
    expect(getRenderableOrigin({ countries: ['IL'], confidence: 'needs_review' })).toBeNull();
    expect(getRenderableOrigin({ countries: [], confidence: 'high' })).toBeNull();
  });

  it('returns normalized renderable countries for high and medium confidence origins', () => {
    expect(getRenderableOrigin({ countries: ['il', 'GB', 'IL'], confidence: 'medium' })).toEqual({
      countries: ['IL', 'GB'],
      flags: ['🇮🇱', '🇬🇧']
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- src/utils/countryFlags.spec.js
```

Expected: FAIL because `src/utils/countryFlags.js` does not exist.

- [ ] **Step 3: Implement country utilities**

Create `src/utils/countryFlags.js`:

```js
export const COUNTRY_NAMES = {
  AD: 'Andorra', AE: 'United Arab Emirates', AF: 'Afghanistan', AG: 'Antigua and Barbuda',
  AI: 'Anguilla', AL: 'Albania', AM: 'Armenia', AO: 'Angola', AQ: 'Antarctica',
  AR: 'Argentina', AS: 'American Samoa', AT: 'Austria', AU: 'Australia', AW: 'Aruba',
  AX: 'Aland Islands', AZ: 'Azerbaijan', BA: 'Bosnia and Herzegovina', BB: 'Barbados',
  BD: 'Bangladesh', BE: 'Belgium', BF: 'Burkina Faso', BG: 'Bulgaria', BH: 'Bahrain',
  BI: 'Burundi', BJ: 'Benin', BL: 'Saint Barthelemy', BM: 'Bermuda', BN: 'Brunei',
  BO: 'Bolivia', BQ: 'Caribbean Netherlands', BR: 'Brazil', BS: 'Bahamas', BT: 'Bhutan',
  BV: 'Bouvet Island', BW: 'Botswana', BY: 'Belarus', BZ: 'Belize', CA: 'Canada',
  CC: 'Cocos Islands', CD: 'Democratic Republic of the Congo', CF: 'Central African Republic',
  CG: 'Republic of the Congo', CH: 'Switzerland', CI: 'Cote dIvoire', CK: 'Cook Islands',
  CL: 'Chile', CM: 'Cameroon', CN: 'China', CO: 'Colombia', CR: 'Costa Rica', CU: 'Cuba',
  CV: 'Cape Verde', CW: 'Curacao', CX: 'Christmas Island', CY: 'Cyprus', CZ: 'Czechia',
  DE: 'Germany', DJ: 'Djibouti', DK: 'Denmark', DM: 'Dominica', DO: 'Dominican Republic',
  DZ: 'Algeria', EC: 'Ecuador', EE: 'Estonia', EG: 'Egypt', EH: 'Western Sahara',
  ER: 'Eritrea', ES: 'Spain', ET: 'Ethiopia', FI: 'Finland', FJ: 'Fiji',
  FK: 'Falkland Islands', FM: 'Micronesia', FO: 'Faroe Islands', FR: 'France',
  GA: 'Gabon', GB: 'United Kingdom', GD: 'Grenada', GE: 'Georgia', GF: 'French Guiana',
  GG: 'Guernsey', GH: 'Ghana', GI: 'Gibraltar', GL: 'Greenland', GM: 'Gambia',
  GN: 'Guinea', GP: 'Guadeloupe', GQ: 'Equatorial Guinea', GR: 'Greece',
  GS: 'South Georgia and the South Sandwich Islands', GT: 'Guatemala', GU: 'Guam',
  GW: 'Guinea-Bissau', GY: 'Guyana', HK: 'Hong Kong', HM: 'Heard Island and McDonald Islands',
  HN: 'Honduras', HR: 'Croatia', HT: 'Haiti', HU: 'Hungary', ID: 'Indonesia',
  IE: 'Ireland', IL: 'Israel', IM: 'Isle of Man', IN: 'India', IO: 'British Indian Ocean Territory',
  IQ: 'Iraq', IR: 'Iran', IS: 'Iceland', IT: 'Italy', JE: 'Jersey', JM: 'Jamaica',
  JO: 'Jordan', JP: 'Japan', KE: 'Kenya', KG: 'Kyrgyzstan', KH: 'Cambodia',
  KI: 'Kiribati', KM: 'Comoros', KN: 'Saint Kitts and Nevis', KP: 'North Korea',
  KR: 'South Korea', KW: 'Kuwait', KY: 'Cayman Islands', KZ: 'Kazakhstan',
  LA: 'Laos', LB: 'Lebanon', LC: 'Saint Lucia', LI: 'Liechtenstein', LK: 'Sri Lanka',
  LR: 'Liberia', LS: 'Lesotho', LT: 'Lithuania', LU: 'Luxembourg', LV: 'Latvia',
  LY: 'Libya', MA: 'Morocco', MC: 'Monaco', MD: 'Moldova', ME: 'Montenegro',
  MF: 'Saint Martin', MG: 'Madagascar', MH: 'Marshall Islands', MK: 'North Macedonia',
  ML: 'Mali', MM: 'Myanmar', MN: 'Mongolia', MO: 'Macao', MP: 'Northern Mariana Islands',
  MQ: 'Martinique', MR: 'Mauritania', MS: 'Montserrat', MT: 'Malta', MU: 'Mauritius',
  MV: 'Maldives', MW: 'Malawi', MX: 'Mexico', MY: 'Malaysia', MZ: 'Mozambique',
  NA: 'Namibia', NC: 'New Caledonia', NE: 'Niger', NF: 'Norfolk Island', NG: 'Nigeria',
  NI: 'Nicaragua', NL: 'Netherlands', NO: 'Norway', NP: 'Nepal', NR: 'Nauru',
  NU: 'Niue', NZ: 'New Zealand', OM: 'Oman', PA: 'Panama', PE: 'Peru',
  PF: 'French Polynesia', PG: 'Papua New Guinea', PH: 'Philippines', PK: 'Pakistan',
  PL: 'Poland', PM: 'Saint Pierre and Miquelon', PN: 'Pitcairn', PR: 'Puerto Rico',
  PS: 'Palestine', PT: 'Portugal', PW: 'Palau', PY: 'Paraguay', QA: 'Qatar',
  RE: 'Reunion', RO: 'Romania', RS: 'Serbia', RU: 'Russia', RW: 'Rwanda',
  SA: 'Saudi Arabia', SB: 'Solomon Islands', SC: 'Seychelles', SD: 'Sudan',
  SE: 'Sweden', SG: 'Singapore', SH: 'Saint Helena', SI: 'Slovenia',
  SJ: 'Svalbard and Jan Mayen', SK: 'Slovakia', SL: 'Sierra Leone', SM: 'San Marino',
  SN: 'Senegal', SO: 'Somalia', SR: 'Suriname', SS: 'South Sudan',
  ST: 'Sao Tome and Principe', SV: 'El Salvador', SX: 'Sint Maarten', SY: 'Syria',
  SZ: 'Eswatini', TC: 'Turks and Caicos Islands', TD: 'Chad', TF: 'French Southern Territories',
  TG: 'Togo', TH: 'Thailand', TJ: 'Tajikistan', TK: 'Tokelau', TL: 'Timor-Leste',
  TM: 'Turkmenistan', TN: 'Tunisia', TO: 'Tonga', TR: 'Turkey', TT: 'Trinidad and Tobago',
  TV: 'Tuvalu', TW: 'Taiwan', TZ: 'Tanzania', UA: 'Ukraine', UG: 'Uganda',
  UM: 'United States Minor Outlying Islands', US: 'United States', UY: 'Uruguay',
  UZ: 'Uzbekistan', VA: 'Vatican City', VC: 'Saint Vincent and the Grenadines',
  VE: 'Venezuela', VG: 'British Virgin Islands', VI: 'U.S. Virgin Islands',
  VN: 'Vietnam', VU: 'Vanuatu', WF: 'Wallis and Futuna', WS: 'Samoa',
  XK: 'Kosovo', YE: 'Yemen', YT: 'Mayotte', ZA: 'South Africa', ZM: 'Zambia', ZW: 'Zimbabwe'
};

const RENDERABLE_CONFIDENCE = new Set(['high', 'medium']);

export function normalizeCountryCode(code) {
  return typeof code === 'string' ? code.trim().toUpperCase() : '';
}

export function isValidCountryCode(code) {
  return Object.prototype.hasOwnProperty.call(COUNTRY_NAMES, normalizeCountryCode(code));
}

export function countryCodeToFlag(code) {
  const normalized = normalizeCountryCode(code);
  if (!isValidCountryCode(normalized)) return '';

  return normalized
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

export function uniqueCountryCodes(countries = []) {
  const seen = new Set();
  const unique = [];

  countries.forEach((country) => {
    const normalized = normalizeCountryCode(country);
    if (isValidCountryCode(normalized) && !seen.has(normalized)) {
      seen.add(normalized);
      unique.push(normalized);
    }
  });

  return unique;
}

export function getCountryName(code) {
  return COUNTRY_NAMES[normalizeCountryCode(code)] || '';
}

export function getRenderableOrigin(origin) {
  if (!origin || !RENDERABLE_CONFIDENCE.has(origin.confidence)) return null;

  const countries = uniqueCountryCodes(origin.countries);
  if (countries.length === 0) return null;

  return {
    countries,
    flags: countries.map(countryCodeToFlag)
  };
}
```

- [ ] **Step 4: Run utility tests**

Run:

```bash
npm test -- src/utils/countryFlags.spec.js
```

Expected: PASS.

- [ ] **Step 5: Commit utilities**

```bash
git add src/utils/countryFlags.js src/utils/countryFlags.spec.js
git commit -m "feat: add country flag utilities"
```

## Task 2: Origin Data Coverage Shell

**Files:**
- Create: `src/data/artistOrigins.json`
- Create: `src/data/artistOrigins.spec.js`

- [ ] **Step 1: Write failing data validation tests**

Create `src/data/artistOrigins.spec.js`:

```js
import { describe, expect, it } from 'vitest';
import timetable from './timetable.json';
import artistOrigins from './artistOrigins.json';
import { isValidCountryCode } from '../utils/countryFlags';

const VALID_CONFIDENCE = new Set(['high', 'medium', 'needs_review']);

function uniqueArtists() {
  return [...new Set(timetable.map((set) => set.artist))].sort((a, b) => a.localeCompare(b));
}

describe('artistOrigins data', () => {
  it('has an origin entry for every unique timetable artist', () => {
    const missing = uniqueArtists().filter((artist) => !artistOrigins[artist]);
    expect(missing).toEqual([]);
  });

  it('does not contain artist keys that are absent from the timetable', () => {
    const timetableArtists = new Set(uniqueArtists());
    const extra = Object.keys(artistOrigins).filter((artist) => !timetableArtists.has(artist));
    expect(extra).toEqual([]);
  });

  it('uses valid origin entry shapes', () => {
    const invalid = Object.entries(artistOrigins).flatMap(([artist, origin]) => {
      const errors = [];

      if (!Array.isArray(origin.countries)) errors.push(`${artist}: countries must be an array`);
      if (!Array.isArray(origin.sources)) errors.push(`${artist}: sources must be an array`);
      if (!VALID_CONFIDENCE.has(origin.confidence)) errors.push(`${artist}: invalid confidence`);
      if (origin.confidence !== 'needs_review' && origin.sources.length === 0) {
        errors.push(`${artist}: renderable entries require sources`);
      }

      origin.countries.forEach((country) => {
        if (!isValidCountryCode(country)) errors.push(`${artist}: invalid country ${country}`);
      });

      return errors;
    });

    expect(invalid).toEqual([]);
  });
});
```

- [ ] **Step 2: Run data tests to verify they fail**

Run:

```bash
npm test -- src/data/artistOrigins.spec.js
```

Expected: FAIL because `src/data/artistOrigins.json` does not exist.

- [ ] **Step 3: Generate a complete review shell from the timetable**

Run this command to create an entry for every unique artist:

```bash
node --input-type=module -e "import fs from 'node:fs'; import timetable from './src/data/timetable.json' with { type: 'json' }; const artists = [...new Set(timetable.map((set) => set.artist))].sort((a, b) => a.localeCompare(b)); const origins = Object.fromEntries(artists.map((artist) => [artist, { countries: [], sources: [], confidence: 'needs_review' }])); fs.writeFileSync('./src/data/artistOrigins.json', JSON.stringify(origins, null, 2) + '\n');"
```

- [ ] **Step 4: Run data tests**

Run:

```bash
npm test -- src/data/artistOrigins.spec.js
```

Expected: PASS, with all artists covered as `needs_review`.

- [ ] **Step 5: Commit the coverage shell**

```bash
git add src/data/artistOrigins.json src/data/artistOrigins.spec.js
git commit -m "feat: add artist origin coverage data"
```

## Task 3: Research And Curate Artist Origins

**Files:**
- Modify: `src/data/artistOrigins.json`

- [ ] **Step 1: Export the current review queue**

Run:

```bash
node --input-type=module -e "import origins from './src/data/artistOrigins.json' with { type: 'json' }; Object.entries(origins).filter(([, entry]) => entry.confidence === 'needs_review').forEach(([artist]) => console.log(artist));"
```

Expected: one line per artist still needing research.

- [ ] **Step 2: Research each artist against reliable sources**

For every artist key in `src/data/artistOrigins.json`, update the entry using this exact shape. This example uses Astrix because the source states the artist origin clearly:

```json
{
  "countries": ["IL"],
  "sources": ["https://en.wikipedia.org/wiki/Astrix_(musician)"],
  "confidence": "high"
}
```

Use `confidence: "high"` when an official artist/project page, official festival page, Discogs, MusicBrainz, Wikipedia, Bandcamp, Resident Advisor, or comparable biography source clearly states the origin. Use `confidence: "medium"` when two reliable secondary sources agree but no official source is found. Keep `confidence: "needs_review"` with empty `countries` and empty `sources` when the origin cannot be verified without guessing.

For collaborations, use this pattern:

```json
{
  "countries": ["IT", "GB", "JM"],
  "sources": [
    "https://en.wikipedia.org/wiki/Gaudi_(musician)",
    "https://en.wikipedia.org/wiki/Don_Letts",
    "https://en.wikipedia.org/wiki/Earl_16"
  ],
  "confidence": "high",
  "notes": "Listed collaboration; countries represent each named participant."
}
```

- [ ] **Step 3: Run data validation after each research batch**

Run after every 25-40 edited artists:

```bash
npm test -- src/data/artistOrigins.spec.js
```

Expected: PASS.

- [ ] **Step 4: Check how many artists remain unverified**

Run:

```bash
node --input-type=module -e "import origins from './src/data/artistOrigins.json' with { type: 'json' }; const pending = Object.entries(origins).filter(([, entry]) => entry.confidence === 'needs_review'); console.log(`${pending.length} needs_review`); pending.forEach(([artist]) => console.log(artist));"
```

Expected: prints the remaining unverified count and names.

- [ ] **Step 5: Commit curated origin data**

```bash
git add src/data/artistOrigins.json
git commit -m "data: curate artist origin countries"
```

## Task 4: Shared Artist Name Component

**Files:**
- Create: `src/components/ArtistNameWithFlags.jsx`
- Create: `src/components/ArtistNameWithFlags.spec.jsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write failing component tests**

Create `src/components/ArtistNameWithFlags.spec.jsx`:

```jsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ArtistNameWithFlags from './ArtistNameWithFlags';

const origins = {
  Astrix: { countries: ['IL'], confidence: 'high' },
  'GMS & Dickster': { countries: ['NL', 'GB'], confidence: 'high' },
  'Gaudi + Don Letts + Earl 16': { countries: ['IT', 'GB', 'JM'], confidence: 'high' },
  Unknown: { countries: ['US'], confidence: 'needs_review' }
};

describe('ArtistNameWithFlags', () => {
  it('renders one flag after the artist name', () => {
    render(<ArtistNameWithFlags artist="Astrix" origins={origins} />);
    expect(screen.getByText('Astrix')).toBeInTheDocument();
    expect(screen.getByLabelText('Origin: Israel')).toHaveTextContent('🇮🇱');
  });

  it('renders two flags around the artist name', () => {
    render(<ArtistNameWithFlags artist="GMS & Dickster" origins={origins} />);
    const flags = screen.getAllByLabelText(/Origin:/);
    expect(flags.map((flag) => flag.textContent)).toEqual(['🇳🇱', '🇬🇧']);
    expect(screen.getByText('GMS & Dickster')).toBeInTheDocument();
  });

  it('renders three or more flags below the artist name', () => {
    const { container } = render(<ArtistNameWithFlags artist="Gaudi + Don Letts + Earl 16" origins={origins} />);
    expect(container.querySelector('.artist-origin-flags.multi')).toBeTruthy();
    expect(screen.getAllByLabelText(/Origin:/).map((flag) => flag.textContent)).toEqual(['🇮🇹', '🇬🇧', '🇯🇲']);
  });

  it('renders only the artist name for missing or unreviewed data', () => {
    render(<ArtistNameWithFlags artist="Unknown" origins={origins} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Origin:/)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- src/components/ArtistNameWithFlags.spec.jsx
```

Expected: FAIL because `ArtistNameWithFlags.jsx` does not exist.

- [ ] **Step 3: Implement the component**

Create `src/components/ArtistNameWithFlags.jsx`:

```jsx
import artistOrigins from '../data/artistOrigins.json';
import { getCountryName, getRenderableOrigin } from '../utils/countryFlags';

function OriginFlag({ country, flag }) {
  return (
    <span className="artist-origin-flag" role="img" aria-label={`Origin: ${getCountryName(country)}`}>
      {flag}
    </span>
  );
}

export default function ArtistNameWithFlags({ artist, className = '', origins = artistOrigins }) {
  const origin = getRenderableOrigin(origins[artist]);
  const classes = ['artist-name-with-flags', className].filter(Boolean).join(' ');

  if (!origin) {
    return <span className={classes}>{artist}</span>;
  }

  const flags = origin.countries.map((country, index) => (
    <OriginFlag key={country} country={country} flag={origin.flags[index]} />
  ));

  if (origin.countries.length === 1) {
    return (
      <span className={`${classes} one-country`}>
        <span className="artist-name-text">{artist}</span>
        <span className="artist-origin-flags">{flags}</span>
      </span>
    );
  }

  if (origin.countries.length === 2) {
    return (
      <span className={`${classes} two-countries`}>
        {flags[0]}
        <span className="artist-name-text">{artist}</span>
        {flags[1]}
      </span>
    );
  }

  return (
    <span className={`${classes} multi-country`}>
      <span className="artist-name-text">{artist}</span>
      <span className="artist-origin-flags multi">{flags}</span>
    </span>
  );
}
```

- [ ] **Step 4: Add shared styles**

Append to the artist-name section of `src/index.css`:

```css
.artist-name-with-flags {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  max-width: 100%;
  min-width: 0;
}

.artist-name-with-flags.multi-country {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  line-height: 1.15;
}

.artist-name-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artist-origin-flags {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  flex: 0 0 auto;
}

.artist-origin-flags.multi {
  justify-content: center;
  font-size: 0.85em;
}

.artist-origin-flag {
  display: inline-flex;
  line-height: 1;
  filter: saturate(1.05);
}
```

- [ ] **Step 5: Run component and utility tests**

Run:

```bash
npm test -- src/components/ArtistNameWithFlags.spec.jsx src/utils/countryFlags.spec.js
```

Expected: PASS.

- [ ] **Step 6: Commit shared component**

```bash
git add src/components/ArtistNameWithFlags.jsx src/components/ArtistNameWithFlags.spec.jsx src/index.css
git commit -m "feat: add artist name origin flag component"
```

## Task 5: Timetable, Search, And Modal Integration

**Files:**
- Modify: `src/components/TimetableGrid.jsx`
- Modify: `src/components/SearchBar.jsx`
- Modify: `src/components/SetModal.jsx`

- [ ] **Step 1: Update `TimetableGrid.jsx`**

Add the import:

```jsx
import ArtistNameWithFlags from './ArtistNameWithFlags';
```

Replace:

```jsx
<div className="set-artist" title={set.artist}>{set.artist}</div>
```

with:

```jsx
<div className="set-artist" title={set.artist}>
  <ArtistNameWithFlags artist={set.artist} />
</div>
```

- [ ] **Step 2: Update `SearchBar.jsx`**

Add the import:

```jsx
import ArtistNameWithFlags from './ArtistNameWithFlags';
```

Replace:

```jsx
<div className="search-item-artist">{set.artist}</div>
```

with:

```jsx
<div className="search-item-artist">
  <ArtistNameWithFlags artist={set.artist} />
</div>
```

- [ ] **Step 3: Update `SetModal.jsx`**

Add the import:

```jsx
import ArtistNameWithFlags from './ArtistNameWithFlags';
```

Replace:

```jsx
<h2 className="modal-artist">{set.artist}</h2>
```

with:

```jsx
<h2 className="modal-artist">
  <ArtistNameWithFlags artist={set.artist} />
</h2>
```

- [ ] **Step 4: Run targeted tests**

Run:

```bash
npm test -- src/components/SearchBar.spec.jsx src/components/TimetableGrid.spec.jsx src/components/ArtistNameWithFlags.spec.jsx
```

Expected: PASS.

- [ ] **Step 5: Commit first integration slice**

```bash
git add src/components/TimetableGrid.jsx src/components/SearchBar.jsx src/components/SetModal.jsx
git commit -m "feat: show origin flags in core artist views"
```

## Task 6: Feed, Schedule, Compare, Live, And Map Integration

**Files:**
- Modify: `src/components/ChronologicalFeed.jsx`
- Modify: `src/components/MySchedule.jsx`
- Modify: `src/components/CompareView.jsx`
- Modify: `src/components/LiveStatusModal.jsx`
- Modify: `src/components/VenueMap.jsx`

- [ ] **Step 1: Update `ChronologicalFeed.jsx`**

Add the import:

```jsx
import ArtistNameWithFlags from './ArtistNameWithFlags';
```

Replace:

```jsx
<span>{set.artist}</span>
```

inside `.feed-artist-name` with:

```jsx
<ArtistNameWithFlags artist={set.artist} />
```

- [ ] **Step 2: Update `MySchedule.jsx`**

Add the import:

```jsx
import ArtistNameWithFlags from './ArtistNameWithFlags';
```

Replace every JSX occurrence of:

```jsx
<div className="feed-artist-name">{set.artist}</div>
```

with:

```jsx
<div className="feed-artist-name">
  <ArtistNameWithFlags artist={set.artist} />
</div>
```

Do not change string usage in schedule keys, sharing URLs, analytics, conflict text, or image export.

- [ ] **Step 3: Update `CompareView.jsx`**

Add the import:

```jsx
import ArtistNameWithFlags from './ArtistNameWithFlags';
```

Replace:

```jsx
<div className="feed-artist-name">{set.artist}</div>
```

with:

```jsx
<div className="feed-artist-name">
  <ArtistNameWithFlags artist={set.artist} />
</div>
```

- [ ] **Step 4: Update `LiveStatusModal.jsx`**

Add the import:

```jsx
import ArtistNameWithFlags from './ArtistNameWithFlags';
```

Replace:

```jsx
<div className="live-artist-name">{activeSet.artist}</div>
```

with:

```jsx
<div className="live-artist-name">
  <ArtistNameWithFlags artist={activeSet.artist} />
</div>
```

Replace:

```jsx
{nextSet.artist} <span className="live-next-time">({nextSet.start})</span>
```

with:

```jsx
<ArtistNameWithFlags artist={nextSet.artist} /> <span className="live-next-time">({nextSet.start})</span>
```

- [ ] **Step 5: Update `VenueMap.jsx` current and next artist displays**

Add the import:

```jsx
import ArtistNameWithFlags from './ArtistNameWithFlags';
```

Replace current-performance artist JSX:

```jsx
<strong>{now.artist}</strong>
```

with:

```jsx
<strong>
  <ArtistNameWithFlags artist={now.artist} />
</strong>
```

Replace next-performance artist JSX:

```jsx
<span>{next.artist}</span>
```

with:

```jsx
<span>
  <ArtistNameWithFlags artist={next.artist} />
</span>
```

- [ ] **Step 6: Run targeted tests**

Run:

```bash
npm test -- src/components/MySchedule.spec.jsx src/components/TimeSimulator.spec.jsx src/components/ArtistNameWithFlags.spec.jsx
```

Expected: PASS.

- [ ] **Step 7: Commit remaining integration**

```bash
git add src/components/ChronologicalFeed.jsx src/components/MySchedule.jsx src/components/CompareView.jsx src/components/LiveStatusModal.jsx src/components/VenueMap.jsx
git commit -m "feat: show origin flags across schedule surfaces"
```

## Task 7: Full Verification And Polish

**Files:**
- Modify only files needed to fix issues found during verification.

- [ ] **Step 1: Run the complete test suite**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS and Vite emits `dist/`.

- [ ] **Step 4: Start the local app**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL such as `http://127.0.0.1:5173/`.

- [ ] **Step 5: Manually inspect key surfaces**

Open the local URL and check:

- Timetable cards show flags without clipping artist names.
- Search suggestions still select the correct set.
- Set modal shows flags in the title.
- My Schedule and Compare views keep their layout stable.
- Live status modal shows flags for active and next artists.
- Venue map popup shows flags for current and next artists.
- Artists with `needs_review` data show no flags.

- [ ] **Step 6: Stop the dev server**

Stop the process started in Step 4 with `Ctrl+C`.

- [ ] **Step 7: Commit verification fixes if any were needed**

If Step 5 required code or CSS fixes:

```bash
git add src
git commit -m "fix: polish artist origin flag display"
```

If no fixes were needed, do not create an empty commit.

## Self-Review Notes

- Spec coverage: data separation, official-origin rules, multi-country display, missing-data behavior, raw artist string preservation, integration points, and tests are covered by Tasks 1-7.
- Placeholder scan: no implementation step uses undefined placeholders; uncertain artist origins are represented explicitly as `needs_review` data.
- Type consistency: origin entries use `countries`, `sources`, `confidence`, and optional `notes` throughout. Rendering uses `ArtistNameWithFlags artist={set.artist}` consistently.
