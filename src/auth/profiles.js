const KEY_LIST = 'vt_profiles';
const KEY_CURRENT = 'vt_current';

export function getProfiles() {
  try { return JSON.parse(localStorage.getItem(KEY_LIST) || '[]'); }
  catch { return []; }
}

export function saveProfile(profile) {
  const list = getProfiles();
  const idx = list.findIndex(p => p.id === profile.id);
  if (idx >= 0) list[idx] = profile;
  else list.push(profile);
  localStorage.setItem(KEY_LIST, JSON.stringify(list));
  return profile;
}

export function deleteProfile(id) {
  const list = getProfiles().filter(p => p.id !== id);
  localStorage.setItem(KEY_LIST, JSON.stringify(list));
  if (getCurrentProfileId() === id) setCurrentProfileId(null);
}

export function getCurrentProfileId() {
  return localStorage.getItem(KEY_CURRENT);
}

export function setCurrentProfileId(id) {
  if (id) localStorage.setItem(KEY_CURRENT, id);
  else localStorage.removeItem(KEY_CURRENT);
}

export function getCurrentProfile() {
  const id = getCurrentProfileId();
  if (!id) return null;
  return getProfiles().find(p => p.id === id) || null;
}

export function createProfile(name, emoji) {
  const profile = {
    id: crypto.randomUUID(),
    name: name.trim(),
    emoji,
    createdAt: Date.now()
  };
  saveProfile(profile);
  setCurrentProfileId(profile.id);
  return profile;
}

export const PROFILE_EMOJIS = ['🦊','🐼','🦁','🐨','🦋','🌟','🎯','🏆','🔥','💎','🚀','🎤'];
