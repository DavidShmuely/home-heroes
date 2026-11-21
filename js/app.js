// App shell: router, rendering, event delegation, wake lock, celebrations.
import { isConfigured } from './config.js';

const root = document.getElementById('app');

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW registration failed', e));
}

if (!isConfigured()) {
  root.innerHTML = `<main class="center-screen">
    <img src="assets/icons/star.svg" alt="" width="110" height="110">
    <h1>כמעט מוכן!</h1>
    <p class="lead">צריך להדביק את פרטי Firebase בקובץ <code dir="ltr">js/config.js</code>.<br>ההוראות המלאות בקובץ README.</p>
  </main>`;
} else {
  start().catch((e) => {
    console.error(e);
    root.innerHTML = `<main class="center-screen"><h1>לא הצלחנו להתחבר</h1><p class="lead">${String(e.message || e)}</p><button class="btn purple" onclick="location.reload()">ניסיון נוסף</button></main>`;
  });
}

async function start() {
  // Firebase modules load only after config exists.
  const D = await import('./data.js');
  const ui = await import('./ui.js');
  const { home } = await import('./screens/home.js');
  const kidMod = await import('./screens/kid.js');
  const parentMod = await import('./screens/parent.js');
  const { isParentUnlocked } = await import('./session.js');
  const { welcome, create, join, setRerender } = await import('./screens/onboarding.js');

  const ROUTES = {
    '': home, kid: kidMod.kid, rewards: kidMod.rewards, avatar: kidMod.avatar,
    parent: parentMod.parent, welcome, create, join
  };
  const ONBOARDING = new Set(['welcome', 'create', 'join']);

  function parse() {
    const h = location.hash.replace(/^#\/?/, '');
    const [name, ...params] = h.split('/').map(decodeURIComponent);
    return { name: name || '', params };
  }

  let current = { screen: null, params: [] };
  let deferred = false;

  function resolve() {
    let { name, params } = parse();
    if (!D.S.familyId) {
      if (!ONBOARDING.has(name)) name = 'welcome';
    } else if (ONBOARDING.has(name) && !(name === 'create' && create.isDone())) {
      name = '';
    }
    if (name === 'parent' && D.S.role !== 'parent' && !isParentUnlocked()) name = '';
    return { screen: ROUTES[name] || home, name, params };
  }

  function render() {
    const ae = document.activeElement;
    if (ae && root.contains(ae) && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) && ae.type !== 'checkbox' && ae.type !== 'radio') {
      deferred = true; return;
    }
    deferred = false;
    const r = resolve();
    if (D.S.familyId && !ONBOARDING.has(r.name) && !D.S.family) {
      root.innerHTML = '<div class="boot"><img src="assets/icons/star.svg" alt="" width="120" height="120"><div>טוען את המשפחה...</div></div>';
      current = r; return;
    }
    const prevScreen = current.screen;
    const scrollY = window.scrollY;
    root.innerHTML = r.screen.render(r.params);
    current = r;
    if (prevScreen === r.screen) window.scrollTo(0, scrollY); else window.scrollTo(0, 0);
  }

  setRerender(render);
  kidMod.setKidRerender(render);
  parentMod.setParentRerender(render);

  root.addEventListener('focusout', () => { if (deferred) setTimeout(render, 0); });
  window.addEventListener('hashchange', render);
  D.onChange(render);
  setInterval(render, 60 * 1000); // keeps greeting/date fresh

  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || !root.contains(el)) return;
    const fn = current.screen?.actions?.[el.dataset.act];
    if (fn) { if (el.tagName !== 'INPUT') e.preventDefault(); fn(el, e, current.params); }
  });
  root.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-submit]');
    if (!form) return;
    e.preventDefault();
    const fn = current.screen?.actions?.[form.dataset.submit];
    if (fn) fn(form, new FormData(form), current.params);
  });
  root.addEventListener('change', (e) => current.screen?.onInput?.(e));

  D.onCelebrate((c) => {
    const kid = D.kidById(c.kidId);
    if (D.S.role === 'tablet') ui.celebrate({ kid, title: c.title, stars: c.stars, iconName: c.icon });
    else ui.toast(`אושר: ${kid?.name || ''} · ${c.title} (+${c.stars || 1})`);
  });
  D.onFamilyLost(() => {
    D.clearLocal();
    ui.toast('המכשיר נותק מהמשפחה', 'err');
    location.hash = '#/welcome';
    render();
  });

  // Keep tablet screen awake.
  let lock = null;
  async function wake() {
    if (D.S.role !== 'tablet' || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
    try { lock = await navigator.wakeLock.request('screen'); } catch { /* not allowed yet */ }
  }
  document.addEventListener('visibilitychange', wake);
  document.addEventListener('pointerdown', () => { if (!lock || lock.released) wake(); });

  render();
  await D.init();
  render();
  wake();
}
