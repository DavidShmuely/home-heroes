// Firebase web config.
// On Firebase Hosting you can leave the placeholders as they are: the config is loaded
// automatically from /__/firebase/init.json. Paste values here only when hosting elsewhere
// (e.g. GitHub Pages or local testing). These values are not secrets: access is protected
// by firestore.rules.
export const firebaseConfig = {
  apiKey: 'AIzaSyAh0aSIUGHoev7LqyUEn-_MCipFDe6J-yY',
  authDomain: 'home-heroes-9d7c3.firebaseapp.com',
  projectId: 'home-heroes-9d7c3',
  storageBucket: 'home-heroes-9d7c3.firebasestorage.app',
  messagingSenderId: '1061863130959',
  appId: '1:1061863130959:web:17e8dffefadacfd01d273a'
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
