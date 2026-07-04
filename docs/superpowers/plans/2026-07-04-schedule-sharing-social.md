# Social Schedule Sharing & Coordination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade local offline schedule sharing to support priorities, notes, unique device IDs, automatic updates for existing friends, and inline coordination notes.

**Architecture:** We generate a unique schedule ID on first load. The share URL is a Base64url-encoded JSON string containing the schedule ID, owner name, sets (indices + priority + personal note), and optional coordination notes. When opening a share URL, if the friend already exists, we auto-update their schedule and show a toast. Otherwise, we show the import modal. Inside the Compare View, we add support for editing and sharing back coordination notes.

**Tech Stack:** React, React Router, LocalStorage, Base64url encoding, Vitest.

---

### Task 1: Refactor Friends Utility
**Files:**
- Create: `src/utils/friends.js` (overwriting the existing one)
- Test: `src/utils/friends.spec.js` (overwriting the existing one)

- [ ] **Step 1: Write the updated test suite for friends.js**
Create or overwrite `src/utils/friends.spec.js` to cover unique ID generation, storing/removing friends by unique ID, and managing coordination notes.
```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getMyScheduleId,
  getFriends,
  saveFriend,
  removeFriend,
  saveCoordinationNote,
} from './friends';

describe('friends utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should generate and persist a unique 8-character schedule ID', () => {
    const id1 = getMyScheduleId();
    expect(id1).toBeTypeOf('string');
    expect(id1).toHaveLength(8);

    const id2 = getMyScheduleId();
    expect(id1).toBe(id2); // should persist
  });

  it('should save and retrieve friends by unique ID', () => {
    const success = saveFriend('friend-123', {
      name: 'Yossi',
      sets: ['set-1::stage-1::2026-07-25::16:00'],
      priorities: { 'set-1::stage-1::2026-07-25::16:00': 'must' },
      notes: { 'set-1::stage-1::2026-07-25::16:00': 'Personal Note' }
    });
    expect(success).toBe(true);

    const friends = getFriends();
    expect(friends['friend-123']).toBeDefined();
    expect(friends['friend-123'].name).toBe('Yossi');
    expect(friends['friend-123'].sets).toContain('set-1::stage-1::2026-07-25::16:00');
  });

  it('should allow saving coordination notes for a friend', () => {
    saveFriend('friend-123', {
      name: 'Yossi',
      sets: ['set-1::stage-1::2026-07-25::16:00'],
    });

    saveCoordinationNote('friend-123', 'set-1::stage-1::2026-07-25::16:00', 'Meet at stage gate');

    const friends = getFriends();
    expect(friends['friend-123'].coordinationNotes['set-1::stage-1::2026-07-25::16:00']).toBe('Meet at stage gate');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**
Run: `npm test src/utils/friends.spec.js`
Expected: FAIL with undefined exports or incorrect behavior.

- [ ] **Step 3: Implement new functions in friends.js**
Overwrite `src/utils/friends.js` to implement ID-based storage, UUID generation, and coordination notes.
```javascript
const STORAGE_KEY = 'ozora_friends';
const MY_ID_KEY = 'ozora_my_schedule_id';
const MAX_FRIENDS = 10;

export function getMyScheduleId() {
  let myId = localStorage.getItem(MY_ID_KEY);
  if (!myId) {
    myId = Math.random().toString(36).substring(2, 10);
    localStorage.setItem(MY_ID_KEY, myId);
  }
  return myId;
}

export function getFriends() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveFriendsData(friends) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(friends));
}

export function saveFriend(id, data) {
  const friends = getFriends();
  if (Object.keys(friends).length >= MAX_FRIENDS && !friends[id]) {
    return false;
  }
  friends[id] = {
    name: data.name,
    sets: data.sets || [],
    priorities: data.priorities || {},
    notes: data.notes || {},
    coordinationNotes: data.coordinationNotes || friends[id]?.coordinationNotes || {},
    importedAt: Date.now()
  };
  saveFriendsData(friends);
  return true;
}

export function removeFriend(id) {
  const friends = getFriends();
  delete friends[id];
  saveFriendsData(friends);
}

export function saveCoordinationNote(friendId, setKey, noteText) {
  const friends = getFriends();
  if (!friends[friendId]) return;
  if (!friends[friendId].coordinationNotes) {
    friends[friendId].coordinationNotes = {};
  }
  if (noteText) {
    friends[friendId].coordinationNotes[setKey] = noteText.slice(0, 100);
  } else {
    delete friends[friendId].coordinationNotes[setKey];
  }
  saveFriendsData(friends);
}
```

- [ ] **Step 4: Run tests to verify they pass**
Run: `npm test src/utils/friends.spec.js`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/utils/friends.js src/utils/friends.spec.js
git commit -m "feat: upgrade friends utility to support unique IDs and coordination notes"
```

---

### Task 2: Base64url Serialization Helper & Language Keys
**Files:**
- Create: `src/utils/shareSerialization.js`
- Test: `src/utils/shareSerialization.spec.js`
- Modify: `src/utils/lang.js`

- [ ] **Step 1: Create language files additions**
Modify `src/utils/lang.js` to add the new translation keys for auto-updates.
In `en` section:
```javascript
    friendScheduleUpdated: "Updated {name}'s schedule and coordination notes!",
    coordinationNote: "Coordination Note",
    coordinationNotePlaceholder: "Meet at... (max 100 chars)",
    shareBackWith: "Share Back with {name}",
```
In `he` section:
```javascript
    friendScheduleUpdated: "הלוח והתיאומים של {name} עודכנו בהצלחה!",
    coordinationNote: "הערת תיאום",
    coordinationNotePlaceholder: "ניפגש ב... (עד 100 תווים)",
    shareBackWith: "שתף בחזרה עם {name}",
```

- [ ] **Step 2: Create unit tests for shareSerialization.js**
Create `src/utils/shareSerialization.spec.js` to test compressing/decompressing favorites, priorities, notes, and coordination notes with Hebrew support.
```javascript
import { describe, it, expect } from 'vitest';
import { compressPayload, decompressPayload } from './shareSerialization';

describe('shareSerialization', () => {
  it('should compress and decompress payload correctly with Hebrew characters', () => {
    const payload = {
      id: 'abc-123',
      name: 'משה',
      sets: [
        [1, 1],
        [2, 2, 'מנגן מעולה!']
      ],
      coord: {
        '2': 'ניפגש ליד העץ'
      }
    };

    const compressed = compressPayload(payload);
    expect(compressed).toBeTypeOf('string');

    const decompressed = decompressPayload(compressed);
    expect(decompressed.id).toBe('abc-123');
    expect(decompressed.name).toBe('משה');
    expect(decompressed.sets[1][2]).toBe('מנגן מעולה!');
    expect(decompressed.coord['2']).toBe('ניפגש ליד העץ');
  });
});
```

- [ ] **Step 3: Implement shareSerialization.js**
Create `src/utils/shareSerialization.js`:
```javascript
export function compressPayload(payload) {
  try {
    const jsonStr = JSON.stringify(payload);
    const base64 = window.btoa(unescape(encodeURIComponent(jsonStr)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (err) {
    console.error('Failed to compress payload', err);
    return '';
  }
}

export function decompressPayload(base64url) {
  try {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = decodeURIComponent(escape(window.atob(base64)));
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to decompress payload', err);
    return null;
  }
}
```

- [ ] **Step 4: Run tests**
Run: `npm test src/utils/shareSerialization.spec.js`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/utils/lang.js src/utils/shareSerialization.js src/utils/shareSerialization.spec.js
git commit -m "feat: add Base64url payload serialization and translation keys"
```

---

### Task 3: Update state hooks to support automatic update and Base64url import
**Files:**
- Modify: `src/hooks/useAppState.js`
- Test: `src/hooks/useAppState.spec.js`

- [ ] **Step 1: Write tests for updated useAppState.js**
Modify `src/hooks/useAppState.spec.js` to mock/simulate the `share` URL parameter containing a Base64url encoded payload. Show that it auto-saves/updates if the friend ID exists, and populates `pendingImport` if not.
```javascript
// Add test checks for base64url parsing, auto updating, and saving as friend
```

- [ ] **Step 2: Modify `useAppState.js`**
Update `useAppState.js` to:
1. Load `myScheduleId` and export it in the hook return value.
2. In the `useEffect` parsing the `share` parameter, handle the Base64url decoded payload instead of legacy comma-separated list of indices.
3. Check if the parsed `id` exists in `ozora_friends`.
   - If yes: update the friend database entry with the incoming schedule. Merge `coord` notes if they are included in the payload. Call `setToastMessage(translations[lang].friendScheduleUpdated.replace('{name}', name))` and do NOT open `ImportModal`.
   - If no: set `pendingImport` containing `{ id, name, sets, priorities, notes, coordinationNotes }` so the user is prompted to save/import them.
Modify: `src/hooks/useAppState.js:82-101`
```javascript
  // 6. Pending import state
  const [pendingImport, setPendingImport] = useState(null);

  const myScheduleId = useMemo(() => getMyScheduleId(), []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareParam = params.get('share');
    if (shareParam) {
      trackEvent('shared_link_opened');
      const payload = decompressPayload(shareParam);
      if (payload && payload.id) {
        // Map indices to composite keys/objects
        const parsedSets = [];
        const parsedPriorities = {};
        const parsedNotes = {};
        const parsedCoordination = payload.coord || {};

        if (Array.isArray(payload.sets)) {
          payload.sets.forEach(([idx, priorityVal, noteText]) => {
            const set = timetableData[idx];
            if (set) {
              const setKey = getSetUniqueKey(set);
              parsedSets.push(setKey);
              if (priorityVal === 1) parsedPriorities[setKey] = 'must';
              else if (priorityVal === 2) parsedPriorities[setKey] = 'want';
              else if (priorityVal === 3) parsedPriorities[setKey] = 'maybe';
              if (noteText) parsedNotes[setKey] = noteText;
            }
          });
        }

        const friends = getFriends();
        if (friends[payload.id]) {
          // Automatic update for existing friend
          saveFriend(payload.id, {
            name: friends[payload.id].name, // keep local name customization
            sets: parsedSets,
            priorities: parsedPriorities,
            notes: parsedNotes,
            coordinationNotes: parsedCoordination
          });
          const messageText = translations[lang].friendScheduleUpdated.replace('{name}', friends[payload.id].name);
          setToastMessage(messageText);
        } else {
          // Open import dialog for new friend
          setPendingImport({
            id: payload.id,
            name: payload.name,
            sets: parsedSets,
            priorities: parsedPriorities,
            notes: parsedNotes,
            coordinationNotes: parsedCoordination
          });
        }
      }
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [lang]);
```

- [ ] **Step 3: Modify `App.jsx` import action handlers**
Update `App.jsx` handles:
```javascript
  const handleImportAll = () => {
    if (!pendingImport) return;
    trackEvent('import_schedule', { sets_count: pendingImport.sets.length });
    setFavorites(prev => {
      const merged = new Set([...prev, ...pendingImport.sets]);
      return Array.from(merged);
    });
    setToastMessage(translations[lang].sharedScheduleImported);
    setPendingImport(null);
  };

  const handleSaveAsFriend = (friendName) => {
    if (!pendingImport) return;
    const saved = saveFriend(pendingImport.id, {
      name: friendName,
      sets: pendingImport.sets,
      priorities: pendingImport.priorities,
      notes: pendingImport.notes,
      coordinationNotes: pendingImport.coordinationNotes
    });
    if (saved) {
      trackEvent('save_friend', { sets_count: pendingImport.sets.length });
      setToastMessage(translations[lang].friendSaved);
    } else {
      setToastMessage(translations[lang].maxFriendsReached);
    }
    setPendingImport(null);
  };
```

- [ ] **Step 4: Run tests**
Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/hooks/useAppState.js src/App.jsx
git commit -m "feat: integrate Base64url URL sharing and auto updates into state hooks"
```

---

### Task 4: Upgrade URL Generation in MySchedule & ImportModal
**Files:**
- Modify: `src/components/MySchedule.jsx`
- Modify: `src/components/ImportModal.jsx`

- [ ] **Step 1: Update `buildShareUrl` in `MySchedule.jsx`**
Modify `buildShareUrl` to encode the unique user ID, display name, sets indices, priorities, and personal notes.
```javascript
  const buildShareUrl = () => {
    const myId = getMyScheduleId();
    const myName = scheduleName || 'Me';
    
    const encodedSets = favorites.map(key => {
      const setIdx = timetableData.findIndex(set => getSetUniqueKey(set) === key);
      if (setIdx === -1) return null;
      
      const priority = priorities[key];
      let pVal = 0;
      if (priority === 'must') pVal = 1;
      else if (priority === 'want') pVal = 2;
      else if (priority === 'maybe') pVal = 3;
      
      const note = notes[key];
      if (note) {
        return [setIdx, pVal, note];
      }
      return pVal ? [setIdx, pVal] : [setIdx];
    }).filter(Boolean);

    if (encodedSets.length === 0) return '';
    
    const payload = {
      id: myId,
      name: myName,
      sets: encodedSets
    };

    const compressed = compressPayload(payload);
    return `${window.location.origin}${window.location.pathname}?share=${compressed}`;
  };
```

- [ ] **Step 2: Update `ImportModal.jsx` to render pending import sets count correctly**
Modify: `src/components/ImportModal.jsx`
```javascript
        <p className="import-modal-count">
          {sharedSets.sets.length} {t.importSetsCount}
        </p>
```

- [ ] **Step 3: Run tests**
Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/components/MySchedule.jsx src/components/ImportModal.jsx
git commit -m "feat: upgrade URL share building and import modal to use compressed Base64url payload"
```

---

### Task 5: Enhance FriendSchedules and CompareView with Coordination Notes
**Files:**
- Modify: `src/components/CompareView.jsx`
- Modify: `src/components/FriendSchedules.jsx`

- [ ] **Step 1: Modify `FriendSchedules.jsx` to pass friend ID**
Update the loop inside `FriendSchedules.jsx` to pass the correct unique ID/key to the `CompareView` instead of name:
```javascript
  const handleCompare = (id) => {
    setComparingFriend(id);
    trackEvent('compare_friend');
  };
```
And pass `friendId={comparingFriend}` and `friendName={friends[comparingFriend].name}` to `CompareView`.

- [ ] **Step 2: Modify `CompareView.jsx`**
Update `CompareView.jsx` to:
1. Render coordination notes for each set using `localStorage.ozora_friends` coordination notes data.
2. Render an inline edit input for editing coordination notes. If the user edits the note, save it using `saveCoordinationNote(friendId, setKey, noteText)`.
3. Add a **"Share Back"** button next to the close button at the top:
   - When clicked, it builds a share URL that includes your schedule PLUS the coordination notes for this friend:
     ```javascript
     const handleShareBack = () => {
       const myId = getMyScheduleId();
       const myName = localStorage.getItem('ozora_schedule_name') || 'Me';
       
       const encodedSets = myFavorites.map(id => {
         const set = timetableData.find(s => s.id === id);
         if (!set) return null;
         const setKey = getSetUniqueKey(set);
         const setIdx = timetableData.indexOf(set);
         
         const priority = priorities[setKey];
         let pVal = 0;
         if (priority === 'must') pVal = 1;
         else if (priority === 'want') pVal = 2;
         else if (priority === 'maybe') pVal = 3;
         
         const note = notes[setKey];
         if (note) return [setIdx, pVal, note];
         return pVal ? [setIdx, pVal] : [setIdx];
       }).filter(Boolean);

       // Extract coordination notes for this specific friend
       const friends = getFriends();
       const friendData = friends[friendId] || {};
       const cNotes = friendData.coordinationNotes || {};
       
       // Map coordination keys from stable string keys to indices for URL encoding
       const encodedCoord = {};
       Object.entries(cNotes).forEach(([key, noteText]) => {
         const set = timetableData.find(s => getSetUniqueKey(s) === key);
         if (set) {
           encodedCoord[timetableData.indexOf(set)] = noteText;
         }
       });

       const payload = {
         id: myId,
         name: myName,
         sets: encodedSets,
         coord: encodedCoord
       };

       const compressed = compressPayload(payload);
       const url = `${window.location.origin}${window.location.pathname}?share=${compressed}`;
       
       navigator.clipboard.writeText(url).then(() => {
         onShowToast(t.linkCopied);
       });
     };
     ```

- [ ] **Step 3: Run all tests to make sure there are no breakages**
Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/components/CompareView.jsx src/components/FriendSchedules.jsx
git commit -m "feat: add coordination notes editing and share-back features to CompareView"
```
