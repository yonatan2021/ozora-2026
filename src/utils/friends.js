const STORAGE_KEY = 'ozora_friends';
const MY_ID_KEY = 'ozora_my_schedule_id';
const MAX_FRIENDS = 10;

export function getMyScheduleId() {
  let myId = localStorage.getItem(MY_ID_KEY);
  if (!myId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      myId = crypto.randomUUID().replace(/-/g, '').substring(0, 8);
    } else {
      myId = Math.random().toString(36).substring(2, 10).padEnd(8, 'x');
    }
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
  if (!id || !data) {
    return false;
  }
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
    friends[friendId].coordinationNotes[setKey] = String(noteText).slice(0, 100);
  } else {
    delete friends[friendId].coordinationNotes[setKey];
  }
  saveFriendsData(friends);
}
