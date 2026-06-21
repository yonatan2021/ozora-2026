const STORAGE_KEY = 'ozora_friends';
const MAX_FRIENDS = 10;

function loadFriends() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveFriendsData(friends) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(friends));
}

export function getFriends() {
  return loadFriends();
}

export function saveFriend(name, setKeys) {
  const friends = loadFriends();
  if (Object.keys(friends).length >= MAX_FRIENDS && !friends[name]) {
    return false;
  }
  friends[name] = {
    sets: setKeys,
    importedAt: Date.now()
  };
  saveFriendsData(friends);
  return true;
}

export function removeFriend(name) {
  const friends = loadFriends();
  delete friends[name];
  saveFriendsData(friends);
}
