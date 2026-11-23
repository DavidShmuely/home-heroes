// Firebase bootstrap: anonymous auth + Firestore with offline cache.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import * as fs from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { loadConfig } from './config.js';

const config = await loadConfig();
if (!config) throw new Error('Firebase config missing');
const app = initializeApp(config);
export const auth = getAuth(app);

let dbInstance;
try {
  dbInstance = fs.initializeFirestore(app, {
    localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() })
  });
} catch (e) {
  console.warn('Persistent cache unavailable, using memory cache', e);
  dbInstance = fs.getFirestore(app);
}
export const db = dbInstance;
export { fs };

// Resolves with the signed-in user, signing in anonymously when needed.
export function ensureAuth() {
  return new Promise((resolve, reject) => {
    const stop = onAuthStateChanged(auth, async (user) => {
      stop();
      if (user) return resolve(user);
      try {
        const cred = await signInAnonymously(auth);
        resolve(cred.user);
      } catch (err) {
        reject(err);
      }
    }, reject);
  });
}
