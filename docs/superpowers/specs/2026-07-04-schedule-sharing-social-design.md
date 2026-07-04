# Spec: Upgraded Local Offline Schedule Sharing & Coordination

## Goal Description
Enhance the existing local, offline-first schedule sharing system so users can coordinate with friends at the festival. 
Currently, sharing only transfers a flat list of favorited artist indices. It does not share user priorities (Must, Want, Maybe), personal notes, or support writing coordination notes between friends (e.g., "Meet at the main bar"). 
This upgrade will introduce stable device-specific identifiers, compressed Base64url URL payloads, automatic updates for existing friends, and in-context coordination notes within the Compare View.

## User Review Required
No server/database is used. All sharing is implemented via URL state serialization (offline-friendly).
Key flows to keep in mind:
- **Unique ID per schedule:** Generated on first load and stored in localStorage.
- **Auto-Update:** If a scanned/opened link has an ID matching an existing saved friend, the app updates their data inline and shows a toast without showing the import dialog.
- **Coordination Notes:** In the Compare View, users can write notes on sets specifically for their coordination with that friend. A "Share Back" button encodes this coordination note and updates the friend's view when scanned/opened.

---

## Technical Architecture & Schema

### 1. Unique ID Generation
- A unique 8-character alphanumeric string (e.g., `u7x9a2b5`) is generated if not already present in `localStorage.ozora_my_schedule_id`.

### 2. Restructured Local Storage Schema
- Legacy `ozora_friends` schema used keys of friend names.
- New `ozora_friends` schema will be keyed by the unique `scheduleId`:
```json
{
  "u7x9a2b5": {
    "name": "Yossi",
    "sets": [
      // array of composite keys
      "Switch Nollie & Tsu::PUMPUI::2026-07-25::16:00"
    ],
    "priorities": {
      "Switch Nollie & Tsu::PUMPUI::2026-07-25::16:00": "must"
    },
    "notes": {
      "Switch Nollie & Tsu::PUMPUI::2026-07-25::16:00": "Awesome artist!"
    },
    "coordinationNotes": {
      "Switch Nollie & Tsu::PUMPUI::2026-07-25::16:00": "Meet at the right side of the stage"
    },
    "importedAt": 1719999999999
  }
}
```

### 3. URL Payload Structure (Compressed JSON)
To keep URLs short and safe for Hebrew text, the payload is structured as a compact JSON object and encoded using Base64url:
```json
{
  "id": "u7x9a2b5",
  "name": "Yossi",
  "sets": [
    [12, 1],                // [index, priority] where priority is 1:must, 2:want, 3:maybe
    [45, 2, "Personal Note"] // [index, priority, noteText] if a personal note exists
  ],
  "coord": {                // Optional: coordination notes specifically for the recipient
    "45": "Meet at 18:00 at stage entrance"
  }
}
```

---

## Proposed Changes

### Component & State Management Changes

#### [MODIFY] [useAppState.js](file:///Users/yonig/Desktop/projects/Ozora-2026/src/hooks/useAppState.js)
- Generate/retrieve `ozora_my_schedule_id` on startup.
- Update the `share` URL parameter parsing logic:
  - If the payload is Base64url, decode it.
  - Check if the decoded payload `id` matches a friend already saved in `ozora_friends`.
  - If yes, automatically update that friend's entry (sets, priorities, notes, coordination notes) and trigger a success Toast notification.
  - If no, set `pendingImport` state to trigger `ImportModal` for saving as a new friend.

#### [MODIFY] [MySchedule.jsx](file:///Users/yonig/Desktop/projects/Ozora-2026/src/components/MySchedule.jsx)
- Update `buildShareUrl()` to package the schedule ID, chosen name, set indices, priorities, and personal notes into the compressed Base64url payload.

#### [MODIFY] [CompareView.jsx](file:///Users/yonig/Desktop/projects/Ozora-2026/src/components/CompareView.jsx)
- Render coordination notes for each set. Clicking a set or note icon will open an inline edit field.
- Save coordination notes to `ozora_friends[friendId].coordinationNotes`.
- Add a **"Share Back"** button at the top that generates a URL containing the user's schedule PLUS the coordination notes for this friend.

#### [MODIFY] [ImportModal.jsx](file:///Users/yonig/Desktop/projects/Ozora-2026/src/components/ImportModal.jsx)
- Adapt the modal to handle the new import payload structure and save it with the correct unique friend ID.

---

## Verification Plan

### Automated Tests
- Run `npm test` to make sure all existing tests pass.
- Write unit tests for:
  - Base64url payload compression and decompression (UTF-8/Hebrew safe).
  - Auto-updating logic inside `useAppState`.
  - Storing and retrieving friend data using the unique ID schema.

### Manual Verification
- Generate a share link, inspect the query parameters, and decode the Base64url payload to ensure it is compact.
- Open the share link in a simulated environment to verify that a new friend triggers the import dialog, and an existing friend is updated immediately with a toast message.
- Verify adding and editing coordination notes in the Compare View, generating a "Share Back" link, and loading it on the other side.
