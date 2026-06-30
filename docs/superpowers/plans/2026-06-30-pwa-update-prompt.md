# PWA Update Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a non-blocking in-app PWA update banner with Update now and Skip actions so home-screen users can activate new deployments without reinstalling.

**Architecture:** Add a focused React component that uses `vite-plugin-pwa`'s virtual registration hook to detect waiting service worker updates. Mount it near the existing global install prompt, store skip state in `sessionStorage`, and reuse existing translation and banner styling patterns.

**Tech Stack:** React 19, Vite, vite-plugin-pwa, Vitest, React Testing Library, CSS custom properties.

---

## File Structure

- Create `src/components/PWAUpdatePrompt.jsx`: owns update-available UI, skip state, and calling the PWA update helper.
- Create `src/components/PWAUpdatePrompt.spec.jsx`: covers hidden state, localized copy, skip, and update action.
- Modify `src/App.jsx`: import and mount `PWAUpdatePrompt` near `InstallPrompt`.
- Modify `src/utils/lang.js`: add localized update prompt copy.
- Modify `src/index.css`: add compact styles for the update prompt, reusing the install banner visual language without changing install prompt behavior.
- Modify `vite.config.js`: switch PWA registration injection to `injectRegister: null` so application code owns registration state.

---

### Task 1: Add Tested PWA Update Prompt Component

**Files:**
- Create: `src/components/PWAUpdatePrompt.jsx`
- Create: `src/components/PWAUpdatePrompt.spec.jsx`
- Modify: `src/utils/lang.js`

- [ ] **Step 1: Write the failing component tests**

Create `src/components/PWAUpdatePrompt.spec.jsx` with this content:

```jsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PWAUpdatePrompt from './PWAUpdatePrompt.jsx';

const updateServiceWorker = vi.fn();
let needRefreshValue = [false, vi.fn()];

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(() => ({
    needRefresh: needRefreshValue,
    updateServiceWorker,
  })),
}));

describe('PWAUpdatePrompt', () => {
  beforeEach(() => {
    sessionStorage.clear();
    updateServiceWorker.mockClear();
    needRefreshValue = [false, vi.fn()];
  });

  it('does not render when no update is waiting', () => {
    render(<PWAUpdatePrompt lang="en" />);

    expect(screen.queryByText('A new version is available')).not.toBeInTheDocument();
  });

  it('renders localized Hebrew update copy when an update is waiting', () => {
    needRefreshValue = [true, vi.fn()];

    render(<PWAUpdatePrompt lang="he" />);

    expect(screen.getByText('גרסה חדשה זמינה')).toBeInTheDocument();
    expect(screen.getByText('אפשר לעדכן עכשיו כדי לקבל את השינויים האחרונים.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'עדכן עכשיו' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'דלג' })).toBeInTheDocument();
  });

  it('hides the banner for the current session when skipped', () => {
    needRefreshValue = [true, vi.fn()];

    render(<PWAUpdatePrompt lang="en" />);
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(screen.queryByText('A new version is available')).not.toBeInTheDocument();
    expect(sessionStorage.getItem('ozora_pwa_update_skipped')).toBe('true');
  });

  it('does not render when the update was already skipped this session', () => {
    sessionStorage.setItem('ozora_pwa_update_skipped', 'true');
    needRefreshValue = [true, vi.fn()];

    render(<PWAUpdatePrompt lang="en" />);

    expect(screen.queryByText('A new version is available')).not.toBeInTheDocument();
  });

  it('asks the waiting service worker to activate when update now is clicked', () => {
    needRefreshValue = [true, vi.fn()];

    render(<PWAUpdatePrompt lang="en" />);
    fireEvent.click(screen.getByRole('button', { name: 'Update now' }));

    expect(updateServiceWorker).toHaveBeenCalledWith(true);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm test -- src/components/PWAUpdatePrompt.spec.jsx
```

Expected: FAIL because `src/components/PWAUpdatePrompt.jsx` does not exist.

- [ ] **Step 3: Add translations**

In `src/utils/lang.js`, add these keys inside both `en` and `he`.

English block:

```js
    pwaUpdateTitle: "A new version is available",
    pwaUpdateBody: "Update now to get the latest changes.",
    pwaUpdateNow: "Update now",
    pwaUpdateSkip: "Skip",
```

Hebrew block:

```js
    pwaUpdateTitle: "גרסה חדשה זמינה",
    pwaUpdateBody: "אפשר לעדכן עכשיו כדי לקבל את השינויים האחרונים.",
    pwaUpdateNow: "עדכן עכשיו",
    pwaUpdateSkip: "דלג",
```

- [ ] **Step 4: Implement the component**

Create `src/components/PWAUpdatePrompt.jsx` with this content:

```jsx
import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { translations } from '../utils/lang';

const SKIP_KEY = 'ozora_pwa_update_skipped';

const getInitialSkipped = () => {
  try {
    return sessionStorage.getItem(SKIP_KEY) === 'true';
  } catch {
    return false;
  }
};

export default function PWAUpdatePrompt({ lang }) {
  const [skipped, setSkipped] = useState(getInitialSkipped);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisterError() {
      // Keep the current cached app usable if registration fails.
    },
  });

  useEffect(() => {
    if (!needRefresh) {
      setSkipped(false);
    }
  }, [needRefresh]);

  if (!needRefresh || skipped) return null;

  const t = translations[lang];

  const handleSkip = () => {
    setSkipped(true);
    try {
      sessionStorage.setItem(SKIP_KEY, 'true');
    } catch {
      // Component state still suppresses the prompt for this render tree.
    }
  };

  return (
    <div className="pwa-update-banner" role="status" aria-live="polite">
      <RefreshCw size={18} className="pwa-update-icon" aria-hidden="true" />
      <div className="pwa-update-copy">
        <strong>{t.pwaUpdateTitle}</strong>
        <span>{t.pwaUpdateBody}</span>
      </div>
      <div className="pwa-update-actions">
        <button className="pwa-update-primary" type="button" onClick={() => updateServiceWorker(true)}>
          {t.pwaUpdateNow}
        </button>
        <button className="pwa-update-skip" type="button" onClick={handleSkip}>
          {t.pwaUpdateSkip}
        </button>
      </div>
      <button className="pwa-update-dismiss" type="button" onClick={handleSkip} aria-label={t.pwaUpdateSkip}>
        <X size={16} />
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Run the component test**

Run:

```bash
npm test -- src/components/PWAUpdatePrompt.spec.jsx
```

Expected: PASS.

- [ ] **Step 6: Check concurrent changes and commit Task 1**

Run:

```bash
git status --short
git diff -- src/components/PWAUpdatePrompt.jsx src/components/PWAUpdatePrompt.spec.jsx src/utils/lang.js
git add src/components/PWAUpdatePrompt.jsx src/components/PWAUpdatePrompt.spec.jsx src/utils/lang.js
git commit -m "feat: add pwa update prompt component"
```

Expected: only these three files are staged and committed.

---

### Task 2: Mount Prompt and Style Banner

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/index.css`
- Modify: `vite.config.js`
- Test: `src/App.spec.jsx`

- [ ] **Step 1: Write the failing app integration test**

In `src/App.spec.jsx`, add the PWA virtual module mock near existing mocks/import setup:

```jsx
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(() => ({
    needRefresh: [true, vi.fn()],
    updateServiceWorker: vi.fn(),
  })),
}));
```

Then add this test inside the existing `describe` block:

```jsx
it('shows the PWA update prompt when a new version is waiting', () => {
  render(<App />);

  expect(screen.getByText('גרסה חדשה זמינה')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the failing app test**

Run:

```bash
npm test -- src/App.spec.jsx
```

Expected: FAIL because `PWAUpdatePrompt` is not mounted yet.

- [ ] **Step 3: Mount the update prompt**

In `src/App.jsx`, add the import:

```jsx
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
```

Render the prompt near the existing global install prompt:

```jsx
      <PWAUpdatePrompt lang={lang} />
      <InstallPrompt lang={lang} />
```

- [ ] **Step 4: Make service worker registration app-owned**

In `vite.config.js`, change:

```js
      injectRegister: 'auto',
```

to:

```js
      injectRegister: null,
```

This avoids duplicate auto-injected registration once React owns update state through `useRegisterSW`.

- [ ] **Step 5: Add CSS**

In `src/index.css`, near `.install-prompt-banner`, add:

```css
.pwa-update-banner {
  position: fixed;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  width: min(560px, calc(100vw - 32px));
  background: var(--surface-card);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  z-index: 1100;
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 24px oklch(0 0 0 / 0.3);
  color: var(--text-primary);
}

.pwa-update-icon {
  flex: 0 0 auto;
  color: var(--primary);
}

.pwa-update-copy {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
  font-size: 0.82rem;
  line-height: 1.35;
}

.pwa-update-copy span {
  color: var(--text-secondary);
}

.pwa-update-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}

.pwa-update-primary,
.pwa-update-skip,
.pwa-update-dismiss {
  cursor: pointer;
  font: inherit;
}

.pwa-update-primary {
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  padding: 6px 12px;
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
}

.pwa-update-skip {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  font-size: 0.82rem;
  white-space: nowrap;
}

.pwa-update-dismiss {
  display: none;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  background: transparent;
  border: none;
  padding: 4px;
}

@media (max-width: 560px) {
  .pwa-update-banner {
    align-items: flex-start;
    bottom: 84px;
  }

  .pwa-update-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .pwa-update-primary,
  .pwa-update-skip {
    min-width: 96px;
  }
}
```

- [ ] **Step 6: Run integration and component tests**

Run:

```bash
npm test -- src/App.spec.jsx src/components/PWAUpdatePrompt.spec.jsx
```

Expected: PASS.

- [ ] **Step 7: Check concurrent changes and commit Task 2**

Run:

```bash
git status --short
git diff -- src/App.jsx src/index.css vite.config.js src/App.spec.jsx
git add src/App.jsx src/index.css vite.config.js src/App.spec.jsx
git commit -m "feat: surface pwa updates in app"
```

Expected: only these four files are staged and committed.

---

### Task 3: Verify Full Build and Existing PWA Behavior

**Files:**
- No source edits expected unless verification exposes a defect.

- [ ] **Step 1: Run focused PWA tests**

Run:

```bash
npm test -- src/components/PWAUpdatePrompt.spec.jsx src/App.spec.jsx src/components/FooterInstallCTA.spec.jsx src/utils/pwaInstall.spec.js
```

Expected: PASS.

- [ ] **Step 2: Run the full test suite**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS and Vite emits `dist/` with PWA assets.

- [ ] **Step 4: Inspect generated registration assets**

Run:

```bash
rg -n "registerSW|dev-sw|serviceWorker|sw.js" dist
```

Expected: generated output includes the service worker assets but does not include duplicate auto-injected `registerSW.js` script tags caused by `injectRegister: 'auto'`.

- [ ] **Step 5: Commit verification-only adjustments if needed**

If a defect is found and fixed, stage only the files changed for that fix:

```bash
git status --short
git add <exact fixed files>
git commit -m "fix: stabilize pwa update verification"
```

If no source changes are needed, do not create an empty commit.
