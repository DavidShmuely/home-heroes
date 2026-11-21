// Service worker: caches the app shell so the tablet opens even without internet.
// Bump VERSION whenever you deploy changes.
const VERSION = 'home-heroes-v1';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/app.js', 'js/config.js', 'js/fb.js', 'js/data.js', 'js/ui.js', 'js/assets.js', 'js/session.js',
  'js/screens/home.js', 'js/screens/kid.js', 'js/screens/parent.js', 'js/screens/onboarding.js',
  'js/vendor/qrcode.js',
  'assets/app/icon-192.png', 'assets/app/icon-512.png',
  ...['bed', 'tooth', 'book', 'plate', 'backpack', 'heart', 'toybox', 'shirt', 'gift', 'tv', 'icecream', 'tree', 'trophy', 'flame', 'sparkle', 'jar', 'star', 'star_empty'].map((n) => `assets/icons/${n}.svg`),
  ...['lion', 'panda', 'fox', 'owl', 'dino', 'robot', 'unicorn', 'cat', 'bunny', 'bear', 'penguin', 'monster', 'acc_crown', 'acc_cap', 'acc_glasses', 'acc_bow', 'acc_party'].map((n) => `assets/avatars/${n}.svg`)
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Same-origin app files: network first (fresh after deploy), cache fallback (offline).
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('index.html')))
    );
    return;
  }
  // Firebase SDK and fonts: cache first.
  if (url.hostname === 'www.gstatic.com' || url.hostname.endsWith('googleapis.com') || url.hostname === 'fonts.gstatic.com') {
    if (url.hostname === 'firestore.googleapis.com') return; // live data, never cache
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(req, copy));
      return res;
    })));
  }
});
