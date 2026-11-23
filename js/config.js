// Firebase web config.
// On Firebase Hosting you can leave the placeholders as they are: the config is loaded
// automatically from /__/firebase/init.json. Paste values here only when hosting elsewhere
// (e.g. GitHub Pages or local testing). These values are not secrets: access is protected
// by firestore.rules.
export const firebaseConfig = {
  apiKey: 'PASTE_API_KEY',
  authDomain: 'PASTE_PROJECT_ID.firebaseapp.com',
  projectId: 'PASTE_PROJECT_ID',
  storageBucket: 'PASTE_PROJECT_ID.appspot.com',
  messagingSenderId: 'PASTE_SENDER_ID',
  appId: 'PASTE_APP_ID'
};

const isPasted = () => !String(firebaseConfig.apiKey).startsWith('PASTE_');

let cached;
// Resolves to a usable config object, or null when none is available.
export function loadConfig() {
  if (cached !== undefined) return Promise.resolve(cached);
  if (isPasted()) { cached = firebaseConfig; return Promise.resolve(cached); }
  return fetch('/__/firebase/init.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null))
    .then((cfg) => { cached = cfg && cfg.apiKey ? cfg : null; return cached; })
    .catch(() => { cached = null; return null; });
}
