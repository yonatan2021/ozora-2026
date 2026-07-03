# הצגת לוח של חבר ותיקון שיתוף ליינאפים במובייל Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to view a saved friend's schedule directly on a clean timeline view with interactive elements, and fix the bug preventing the "Friend Schedules" section from showing when the user's favorites list is empty.

**Architecture:** Modifying `MySchedule.jsx` to load friends list and conditionally render the empty state or the main page container. Modifying `FriendSchedules.jsx` to support a viewing state and rendering the new `FriendScheduleView` component. Adding translations to `lang.js` and styling to `index.css`.

**Tech Stack:** React, Lucide React, Vitest, React Testing Library

---

### Task 1: Add Translations
Add translation strings in English and Hebrew for the new view friend options.

**Files:**
- Modify: `src/utils/lang.js:70-115` (English section)
- Modify: `src/utils/lang.js:180-220` (Hebrew section)

- [ ] **Step 1: Write translation changes**

Replace in `src/utils/lang.js` around line 88 (English section):
```javascript
    friendSaved: "Schedule saved!",
    maxFriendsReached: "Max 10 friend schedules",
    view: "View",
    viewingSchedule: "Viewing {name}'s Schedule",
    backToMySchedule: "Back to My Schedule",
    addToMySchedule: "Add to my schedule",
    removeFromMySchedule: "Remove from my schedule",
    mapTab: "Map",
```

Replace in `src/utils/lang.js` around line 200 (Hebrew section):
```javascript
    friendSaved: "הלוח נשמר!",
    maxFriendsReached: "ניתן לשמור עד 10 לוחות חברים",
    view: "צפייה",
    viewingSchedule: "צופה בלוח של {name}",
    backToMySchedule: "חזור ללוח שלי",
    addToMySchedule: "הוסף ללוח שלי",
    removeFromMySchedule: "הסר מהלוח שלי",
    mapTab: "מפה",
```

- [ ] **Step 2: Commit**
```bash
git add src/utils/lang.js
git commit -m "feat: add translations for friend schedule view"
```

---

### Task 2: Create FriendScheduleView Component
Create a new component to display the clean timeline of the friend's schedule.

**Files:**
- Create: `src/components/FriendScheduleView.jsx`

- [ ] **Step 1: Implement the component**

Write the code for `src/components/FriendScheduleView.jsx`:
```jsx
import { ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { translations } from '../utils/lang';
import { getSetUniqueKey, getSetStatus } from '../utils/time';
import ArtistNameWithFlags from './ArtistNameWithFlags';

const STAGE_CLASSES = {
  "OZORA STAGE": "stage-ozora",
  "PUMPUI": "stage-pumpui",
  "THE DOME": "stage-dome",
  "DRAGON NEST / COOKING GROOVE": "stage-dragon",
  "VISIUM GARDEN": "stage-visium",
  "TEK ZERO (2000s Trance)": "stage-tekzero"
};

export default function FriendScheduleView({
  friendName,
  friendSetKeys,
  myFavorites,
  timetableData,
  lang,
  onSetClick,
  onClose,
  onAddToFavorites
}) {
  const t = translations[lang];
  const isHe = lang === 'he';

  const friendSets = friendSetKeys
    .map(key => timetableData.find(s => getSetUniqueKey(s) === key))
    .filter(Boolean);

  friendSets.sort((a, b) => {
    const dd = a.date.localeCompare(b.date);
    if (dd !== 0) return dd;
    return a.start.localeCompare(b.start);
  });

  const grouped = friendSets.reduce((acc, set) => {
    if (!acc[set.day]) acc[set.day] = [];
    acc[set.day].push(set);
    return acc;
  }, {});

  const BackIcon = isHe ? ArrowRight : ArrowLeft;

  return (
    <div className="friend-schedule-view stagger-slide-up">
      <div className="friend-view-header">
        <button className="friend-view-back-btn" onClick={onClose} aria-label={t.backToMySchedule}>
          <BackIcon size={18} />
          <span>{t.backToMySchedule}</span>
        </button>
        <h3>{t.viewingSchedule.replace('{name}', friendName)}</h3>
      </div>

      <div className="friend-view-timeline">
        {friendSets.length === 0 ? (
          <div className="empty-state">
            <p>{isHe ? 'אין הופעות בלוח של חבר זה.' : 'No sets in this friend\'s schedule.'}</p>
          </div>
        ) : (
          Object.entries(grouped).map(([day, sets]) => (
            <div key={day} className="friend-day-group">
              <div className="feed-time-header">
                {isHe
                  ? day.replace('DAY', 'יום').replace('Warmup Sat', 'חימום שבת').replace('Warmup Sun', 'חימום ראשון')
                  : day}
              </div>
              <div className="feed-sets-list">
                {sets.map(set => {
                  const isFav = myFavorites.includes(set.id);
                  const evalTime = new Date();
                  evalTime.setFullYear(2026); // Match app-wide evaluation context
                  const status = getSetStatus(set, evalTime);

                  return (
                    <div
                      key={set.id}
                      className={`feed-set-card ${STAGE_CLASSES[set.stage]} ${status}`}
                      onClick={() => onSetClick(set)}
                    >
                      <div className="feed-set-info">
                        <div className="feed-artist-name">
                          <ArtistNameWithFlags artist={set.artist} />
                        </div>
                        <div className="feed-stage-name">
                          <span className="stage-dot"></span>
                          <span>{set.stage} {set.type ? `• ${set.type}` : ''}</span>
                        </div>
                        <div className="feed-time-duration">{set.start} - {set.end}</div>
                      </div>
                      <div className="feed-card-actions">
                        <button
                          className="feed-fav-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToFavorites(set.id);
                          }}
                          title={isFav ? t.removeFromMySchedule : t.addToMySchedule}
                          aria-label={isFav ? t.removeFromMySchedule : t.addToMySchedule}
                        >
                          <Star
                            size={16}
                            fill={isFav ? "var(--stage-visium)" : "none"}
                            stroke="var(--stage-visium)"
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add src/components/FriendScheduleView.jsx
git commit -m "feat: create FriendScheduleView component"
```

---

### Task 3: Modify FriendSchedules to Add View Action
Add a "View" action button next to the existing actions, and conditional rendering of `FriendScheduleView`.

**Files:**
- Modify: `src/components/FriendSchedules.jsx`

- [ ] **Step 1: Modify imports and add viewing states**

Modify `src/components/FriendSchedules.jsx` to import `Eye` and add `viewingFriend` / `FriendScheduleView`.
Replace top imports (lines 1-7):
```javascript
import { useState } from 'react';
import { Users, ChevronDown, ChevronUp, Trash2, GitCompare, Eye } from 'lucide-react';
import { translations } from '../utils/lang';
import { getFriends, removeFriend } from '../utils/friends';
import CompareView from './CompareView';
import FriendScheduleView from './FriendScheduleView';
import { trackEvent } from '../utils/analytics';
```

Replace lines 10-12 (state initialization):
```javascript
  const [expanded, setExpanded] = useState(false);
  const [comparingFriend, setComparingFriend] = useState(null);
  const [viewingFriend, setViewingFriend] = useState(null);
  const t = translations[lang];
```

Insert `viewingFriend` rendering block around line 29:
```javascript
  if (viewingFriend) {
    return (
      <FriendScheduleView
        friendName={viewingFriend}
        friendSetKeys={friends[viewingFriend].sets}
        myFavorites={myFavorites}
        timetableData={timetableData}
        lang={lang}
        onSetClick={onSetClick}
        onClose={() => setViewingFriend(null)}
        onAddToFavorites={(id) => toggleFavorite(id, 'friend_view')}
      />
    );
  }
```

Add `handleView` callback:
```javascript
  const handleView = (name) => {
    setViewingFriend(name);
    trackEvent('view_friend');
  };
```

Modify the friend card actions:
```javascript
              <div className="friend-actions">
                <button onClick={() => handleView(name)} className="friend-action-btn">
                  <Eye size={14} />
                  <span>{t.view}</span>
                </button>
                <button onClick={() => handleCompare(name)} className="friend-action-btn">
                  <GitCompare size={14} />
                  <span>{t.compare}</span>
                </button>
                <button onClick={() => handleRemove(name)} className="friend-action-btn danger">
                  <Trash2 size={14} />
                  <span>{t.remove}</span>
                </button>
              </div>
```

- [ ] **Step 2: Commit**
```bash
git add src/components/FriendSchedules.jsx
git commit -m "feat: integrate FriendScheduleView and add View button to FriendSchedules"
```

---

### Task 4: Fix Empty State Bug in MySchedule
Modify `MySchedule.jsx` to render the page even when favorites are empty if friends exist.

**Files:**
- Modify: `src/components/MySchedule.jsx`

- [ ] **Step 1: Update empty state early return**

Replace lines 161-171 in `src/components/MySchedule.jsx`:
```javascript
  const hasFriends = Object.keys(getFriends()).length > 0;

  if (favorites.length === 0 && !hasFriends) {
    return (
      <div className="empty-state stagger-slide-up" style={{ '--card-index': 0 }}>
        <p>
          {isHe
            ? 'לוח הזמנים שלך ריק. לחץ על כוכב (★) בלוח ההופעות כדי להוסיף אמנים.'
            : 'Your schedule is empty. Star (★) artists in the timetable to add them here.'}
        </p>
      </div>
    );
  }
```

Replace lines 182-389:
In the render function, instead of outputting the main schedule content directly, wrap it in a conditional or render the empty state message inside the container if favorites is empty.

Find the code where conflicts, live status, and personal timeline are rendered (lines 213-377), and conditionally render them ONLY if `favorites.length > 0`. If `favorites.length === 0`, render the empty state paragraph instead:
```javascript
  return (
    <div className="my-schedule-container stagger-slide-up" style={{ '--card-index': 0 }}>
      {/* Schedule Name */}
      <div className="schedule-name-section">
        {editingName ? (
          <div className="schedule-name-edit">
            <input
              ref={nameInputRef}
              type="text"
              className="schedule-name-input"
              placeholder={isHe ? 'הכנס את השם שלך...' : 'Enter your name...'}
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value.slice(0, 30))}
              onBlur={handleNameSave}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
              autoFocus
              maxLength={30}
            />
          </div>
        ) : (
          <button className="schedule-name-display" onClick={() => setEditingName(true)}>
            <Pencil size={14} className="schedule-name-edit-icon" />
            <span>
              {scheduleName
                ? (isHe ? `הלוח של ${scheduleName}` : `${scheduleName}'s Schedule`)
                : (isHe ? 'לחץ להוסיף את השם שלך ללוח' : 'Tap to add your name')}
            </span>
          </button>
        )}
      </div>

      {favorites.length > 0 ? (
        <>
          <ConflictBanner
            conflicts={conflicts}
            lang={lang}
            onSetClick={onSetClick}
          />

          {/* Live Status Board */}
          {(activeFavorites.length > 0 || upcomingFavorites.length > 0) && (
            <div className="live-favs-section">
              <h3>
                <Radio size={18} className="live-radio-icon" style={{ color: 'var(--primary)' }} />
                <span>{isHe ? 'מה קורה עכשיו בבמות' : 'Live Status Board'}</span>
              </h3>

              <div className="live-favs-grid">
                {activeFavorites.map((set, index) => (
                  <div
                    key={set.id}
                    className={`feed-set-card ${STAGE_CLASSES[set.stage]} active stagger-slide-up`}
                    style={{ '--card-index': index + 1 }}
                    onClick={() => onSetClick(set)}
                  >
                    <div className="feed-set-info">
                      <div className="live-now-tag">
                        <span className="live-wave-indicator">
                          <span className="wave-bar bar-1"></span>
                          <span className="wave-bar bar-2"></span>
                          <span className="wave-bar bar-3"></span>
                        </span>
                        <span>{isHe ? 'מנגן כרגע' : 'Now Playing'}</span>
                      </div>
                      <div className="feed-artist-name">
                        <ArtistNameWithFlags artist={set.artist} />
                      </div>
                      <div className="feed-stage-name">
                        <span className="stage-dot"></span>
                        <span>{set.stage}</span>
                      </div>
                      <div className="feed-time-duration">{set.start} - {set.end}</div>
                    </div>
                  </div>
                ))}

                {upcomingFavorites.slice(0, 2).map((set, index) => (
                  <div
                    key={set.id}
                    className={`feed-set-card ${STAGE_CLASSES[set.stage]} stagger-slide-up`}
                    style={{ '--card-index': activeFavorites.length + index + 1 }}
                    onClick={() => onSetClick(set)}
                  >
                    <div className="feed-set-info">
                      <div className="feed-stage-name" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {isHe ? 'ההופעה הבאה שלך' : 'Next Up'}
                      </div>
                      <div className="feed-artist-name">
                        <ArtistNameWithFlags artist={set.artist} />
                      </div>
                      <div className="feed-stage-name">
                        <span className="stage-dot"></span>
                        <span>{set.stage}</span>
                      </div>
                      <div className="feed-time-duration">{set.day} • {set.start}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Timeline List */}
          <div className="fav-feed-section">
            <div className="fav-feed-header-row">
              <h3>{scheduleName
                ? (isHe ? `הלוח של ${scheduleName}` : `${scheduleName}'s Schedule`)
                : (isHe ? 'ציר הזמן שלי' : 'My Personal Timeline')}</h3>
              <button
                className={`filter-must-btn ${filterMust ? 'active' : ''}`}
                onClick={() => {
                  const next = !filterMust;
                  setFilterMust(next);
                  trackEvent('toggle_filter_must', { filter_active: next });
                }}
              >
                <Filter size={14} />
                <span>{t.filterMustSee}</span>
              </button>
              <ShareMenu
                shareUrl={buildShareUrl()}
                lang={lang}
                onCopyLink={handleCopyLink}
                onExportImage={handleExportImage}
              />
            </div>
            <div className="feed-view">
              {Object.entries(displayGroupedByDay).map(([day, daySets]) => (
                <div key={day} className="feed-time-block">
                  <div className="feed-time-header">
                    {isHe ? day.replace('DAY', 'יום').replace('Warmup Sat', 'חימום שבת').replace('Warmup Sun', 'חימום ראשון') : day}
                  </div>
                  <div className="feed-sets-list">
                    {daySets.map((set, index) => {
                      const status = getSetStatus(set, evalTime);
                      const setKey = getSetUniqueKey(set);
                      const currentPriority = priorities[setKey] || null;
                      return (
                        <div
                          key={set.id}
                          className={`feed-set-card ${STAGE_CLASSES[set.stage]} ${status} ${getPriorityCardClass(setKey)} stagger-slide-up`}
                          style={{ '--card-index': index }}
                          onClick={() => onSetClick(set)}
                        >
                          <div className="feed-set-info">
                            <div className="feed-artist-name">
                              <ArtistNameWithFlags artist={set.artist} />
                            </div>
                            <div className="feed-stage-name">
                              <span className="stage-dot"></span>
                              <span>{set.stage} {set.type ? `• ${set.type}` : ''}</span>
                            </div>
                            <div className="feed-time-duration">{set.start} - {set.end}</div>
                            {notes[setKey] && (
                              <div className="feed-note-text">
                                <MessageSquare size={11} />
                                <span>{notes[setKey]}</span>
                              </div>
                            )}
                            {conflictSetIds.has(set.id) && (
                              <div className="feed-conflict-badge">
                                <AlertTriangle size={11} />
                                <span>
                                  {t.conflictsWith}{' '}
                                  {getConflictsForSet(set.id, conflicts)
                                    .map(c => getConflictPartner(set.id, c).artist)
                                    .join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="feed-card-actions">
                            <button
                              className={`priority-pill priority-pill-${currentPriority || 'none'}`}
                              onClick={(e) => handleCyclePriority(e, setKey)}
                              aria-label="Set priority"
                              title={isHe ? 'לחץ לשנות עדיפות' : 'Click to change priority'}
                            >
                              {currentPriority ? priorityLabels[currentPriority] : (isHe ? 'עדיפות' : 'Priority')}
                            </button>
                            <button
                              className="feed-fav-btn"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(set.id, 'favorites');
                                }}
                            >
                              <Star size={16} fill="var(--stage-visium)" stroke="var(--stage-visium)" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state stagger-slide-up" style={{ '--card-index': 1, padding: '2rem 1rem' }}>
          <p>
            {isHe
              ? 'לוח הזמנים שלך ריק. לחץ על כוכב (★) בלוח ההופעות כדי להוסיף אמנים.'
              : 'Your schedule is empty. Star (★) artists in the timetable to add them here.'}
          </p>
        </div>
      )}

      <FriendSchedules
        lang={lang}
        timetableData={timetableData}
        myFavorites={favorites}
        onSetClick={onSetClick}
        toggleFavorite={toggleFavorite}
        onShowToast={onShowToast}
      />
    </div>
  );
```

- [ ] **Step 2: Commit**
```bash
git add src/components/MySchedule.jsx
git commit -m "fix: allow rendering FriendSchedules when my favorites is empty"
```

---

### Task 5: Add Styles for FriendScheduleView & Mobile Optimization
Add styling for the new view layout and responsive styling for the buttons in `src/index.css`.

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add new CSS classes**

Append to `src/index.css`:
```css
/* Friend Schedule View */
.friend-schedule-view {
  padding: 0 4px;
}

.friend-view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
}

.friend-view-back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--glow-primary);
  color: var(--primary);
  border: 1px solid oklch(from var(--primary) l c h / 0.2);
  border-radius: var(--radius-md);
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.friend-view-back-btn:hover {
  background: var(--primary);
  color: white;
}

.friend-view-header h3 {
  font-size: 1rem;
  color: var(--text-primary);
  margin: 0;
}

.friend-view-timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Adjust friend list action buttons gap and flex wrapping in mobile */
@media (max-width: 480px) {
  .friend-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    width: 100%;
    margin-top: 8px;
  }
  
  .friend-action-btn {
    flex: 1 1 calc(50% - 6px);
    justify-content: center;
    padding: 10px 8px; /* Bigger touch targets */
    font-size: 0.8rem;
  }

  .friend-action-btn.danger {
    flex: 1 1 100%;
    margin-top: 4px;
  }
}
```

- [ ] **Step 2: Commit**
```bash
git add src/index.css
git commit -m "style: add friend schedule view and mobile button enhancements"
```

---

### Task 6: Add Tests for FriendScheduleView & Verification
Write automated tests to verify the component and its integration.

**Files:**
- Create: `src/components/FriendScheduleView.spec.jsx`
- Modify: `src/components/MySchedule.spec.jsx`

- [ ] **Step 1: Write FriendScheduleView tests**

Create `src/components/FriendScheduleView.spec.jsx`:
```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FriendScheduleView from './FriendScheduleView';

const mockTimetableData = [
  { id: '1', artist: 'Astrix', stage: 'OZORA STAGE', day: 'DAY 1', start: '22:00', end: '23:30', date: '2026-07-27', type: 'Trance' },
  { id: '2', artist: 'Liquid Soul', stage: 'OZORA STAGE', day: 'DAY 1', start: '23:30', end: '01:00', date: '2026-07-27', type: 'Trance' }
];

describe('FriendScheduleView Component', () => {
  it('renders friend schedule sets correctly', () => {
    const friendSetKeys = ['Astrix-OZORA STAGE-DAY 1-22:00'];
    render(
      <FriendScheduleView
        friendName="Yoni"
        friendSetKeys={friendSetKeys}
        myFavorites={[]}
        timetableData={mockTimetableData}
        lang="en"
        onSetClick={vi.fn()}
        onClose={vi.fn()}
        onAddToFavorites={vi.fn()}
      />
    );
    
    expect(screen.getByText("Viewing Yoni's Schedule")).toBeInTheDocument();
    expect(screen.getByText("Astrix")).toBeInTheDocument();
  });

  it('triggers onAddToFavorites when star icon is clicked', async () => {
    const friendSetKeys = ['Astrix-OZORA STAGE-DAY 1-22:00'];
    const handleAddToFavorites = vi.fn();
    
    render(
      <FriendScheduleView
        friendName="Yoni"
        friendSetKeys={friendSetKeys}
        myFavorites={[]}
        timetableData={mockTimetableData}
        lang="en"
        onSetClick={vi.fn()}
        onClose={vi.fn()}
        onAddToFavorites={handleAddToFavorites}
      />
    );

    const starBtn = screen.getByRole('button', { name: /Add to my schedule/i });
    await userEvent.click(starBtn);
    expect(handleAddToFavorites).toHaveBeenCalledWith('1');
  });

  it('triggers onClose when back button is clicked', async () => {
    const handleClose = vi.fn();
    render(
      <FriendScheduleView
        friendName="Yoni"
        friendSetKeys={[]}
        myFavorites={[]}
        timetableData={mockTimetableData}
        lang="en"
        onSetClick={vi.fn()}
        onClose={handleClose}
        onAddToFavorites={vi.fn()}
      />
    );

    const backBtn = screen.getByRole('button', { name: /Back to My Schedule/i });
    await userEvent.click(backBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Update MySchedule tests to check empty state with friends**

Add to `src/components/MySchedule.spec.jsx`:
```javascript
  it('renders FriendSchedules even if favorites is empty if friends exist', () => {
    // Mock getFriends to return some friends
    vi.mock('../utils/friends', () => ({
      getFriends: () => ({
        "Alice": { sets: ["Astrix-OZORA STAGE-DAY 1-22:00"] }
      }),
      removeFriend: vi.fn(),
      saveFriend: vi.fn()
    }));

    render(
      <MySchedule 
        lang="en"
        timetableData={mockData}
        favorites={[]}
        toggleFavorite={vi.fn()}
        onSetClick={vi.fn()}
        simTime={new Date().getTime()}
        isSimulated={false}
        onShowToast={vi.fn()}
        notesVersion={0}
      />
    );

    // Should show the empty schedule text
    expect(screen.getByText(/Your schedule is empty/i)).toBeInTheDocument();
    // BUT should also show the friend schedule list section!
    expect(screen.getByText(/Friend Schedules/i)).toBeInTheDocument();
  });
```

- [ ] **Step 3: Run Vitest tests**
Run: `npm test`
Expected: All tests pass.

- [ ] **Step 4: Commit tests**
```bash
git add src/components/FriendScheduleView.spec.jsx src/components/MySchedule.spec.jsx
git commit -m "test: add tests for friend schedule view and my schedule bug fix"
```
