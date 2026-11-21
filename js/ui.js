// Shared UI helpers: escaping, avatars, toasts, modals, sounds, celebration.
import { CHARACTERS, ACCESSORIES, color, icon } from './assets.js';
import { S } from './data.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function avatarHTML(avatar, size = 64, extraClass = '') {
  const a = avatar || {};
  const ch = CHARACTERS.find((c) => c.id === a.char) || CHARACTERS[0];
  const acc = ACCESSORIES.find((x) => x.id === a.acc);
  const bg = color(a.color).bg;
  return `<span class="avatar ${extraClass}" style="width:${size}px;height:${size}px;background:${bg}">
    <img src="${ch.src}" alt="" draggable="false">
    ${acc && acc.src ? `<img src="${acc.src}" alt="" draggable="false">` : ''}
  </span>`;
}

export const starImg = (size = 24) => `<img class="star-img" src="${icon('star')}" alt="" width="${size}" height="${size}">`;
export const iconImg = (name, size = 40) => `<img src="${icon(name)}" alt="" width="${size}" height="${size}" draggable="false">`;
export const starPill = (n, size = 'md') => `<span class="star-pill ${size}">${starImg(size === 'lg' ? 34 : 22)}<b>${n ?? 0}</b></span>`;

export const svg = {
  back: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  lock: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>',
  clock: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  edit: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  speaker: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/></svg>',
  wifiOff: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M19 13a10 10 0 0 0-2-1.6M2 9a15 15 0 0 1 4.5-2.9M22 9a15 15 0 0 0-9-3.9"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>',
  dice: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="16" cy="16" r="1.3" fill="currentColor"/></svg>'
};

// ---------- toast ----------
let toastTimer;
export function toast(msg, kind = '') {
  const el = document.getElementById('toast');
  el.className = 'show ' + kind;
  el.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 2800);
}

// ---------- modal ----------
let modalActions = {};
export function openModal(html, actions = {}) {
  const root = document.getElementById('modal');
  root.innerHTML = `<div class="modal-back" data-mact="__close"></div><div class="modal-card" role="dialog" aria-modal="true">${html}</div>`;
  root.classList.add('open');
  modalActions = actions;
  const first = root.querySelector('input, select, textarea, button');
  if (first) setTimeout(() => first.focus(), 50);
}
export function closeModal() {
  const root = document.getElementById('modal');
  root.classList.remove('open');
  root.innerHTML = '';
  modalActions = {};
}
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-mact]');
  if (!el || !document.getElementById('modal').contains(el)) return;
  const name = el.dataset.mact;
  if (name === '__close') return closeModal();
  if (modalActions[name]) modalActions[name](el, e);
});
document.addEventListener('submit', (e) => {
  const form = e.target.closest('#modal form[data-msubmit]');
  if (!form) return;
  e.preventDefault();
  const fn = modalActions[form.dataset.msubmit];
  if (fn) fn(form, new FormData(form));
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// ---------- PIN pad ----------
export function pinPad({ title = 'קוד הורה', onDone }) {
  let val = '';
  const render = () => {
    const dots = [0, 1, 2, 3].map((i) => `<span class="pin-dot ${i < val.length ? 'on' : ''}"></span>`).join('');
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']
      .map((k) => k === '' ? '<span></span>' : `<button type="button" class="pin-key" data-mact="key" data-k="${k}" aria-label="${k === '⌫' ? 'מחיקה' : k}">${k}</button>`).join('');
    return `<div class="pin">
      <div class="pin-title">${svg.lock} ${esc(title)}</div>
      <div class="pin-dots" aria-label="${val.length} ספרות הוקלדו">${dots}</div>
      <div class="pin-keys" dir="ltr">${keys}</div>
      <button type="button" class="btn ghost" data-mact="__close">ביטול</button>
    </div>`;
  };
  const actions = {
    key: async (el) => {
      const k = el.dataset.k;
      if (k === '⌫') val = val.slice(0, -1); else if (val.length < 4) val += k;
      document.querySelector('#modal .modal-card').innerHTML = render();
      if (val.length === 4) {
        const ok = await onDone(val);
        if (ok === false) {
          val = '';
          const card = document.querySelector('#modal .modal-card');
          card.innerHTML = render();
          card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
        }
      }
    }
  };
  openModal(render(), actions);
}

// ---------- sound (generated, no files) ----------
let ctx;
function audio() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
document.addEventListener('pointerdown', () => audio(), { once: true });
function tone(freq, start, dur, type = 'sine', gain = 0.18) {
  const a = audio(); if (!a) return;
  const o = a.createOscillator(); const g = a.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, a.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + start + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + start); o.stop(a.currentTime + start + dur + 0.05);
}
export function sound(kind) {
  if (!S.sound) return;
  if (kind === 'tap') { tone(660, 0, 0.12, 'triangle'); tone(990, 0.08, 0.16, 'triangle'); }
  if (kind === 'undo') { tone(500, 0, 0.12, 'triangle'); tone(380, 0.08, 0.14, 'triangle'); }
  if (kind === 'bell') { tone(880, 0, 0.5, 'sine', 0.2); tone(1320, 0.15, 0.6, 'sine', 0.15); }
  if (kind === 'party') [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.11, 0.35, 'triangle', 0.16));
}

// ---------- speech (young kids) ----------
export function speak(text) {
  try {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'he-IL'; u.rate = 0.9;
    const v = speechSynthesis.getVoices().find((x) => x.lang && x.lang.startsWith('he'));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch { /* ignore */ }
}

// ---------- celebration overlay ----------
const queue = [];
let showing = false;
export function celebrate({ kid, title, stars, iconName }) {
  queue.push({ kid, title, stars, iconName });
  if (!showing) nextCelebration();
}
function nextCelebration() {
  const item = queue.shift();
  const fx = document.getElementById('fx');
  if (!item) { showing = false; fx.className = ''; fx.innerHTML = ''; return; }
  showing = true;
  const colors = ['#FFC23D', '#FF6B8A', '#2BB673', '#3B8BFF', '#FF8A2B', '#8EE3E8', '#FFFFFF'];
  let conf = '';
  for (let i = 0; i < 48; i++) {
    const w = 8 + (i * 7) % 10;
    const h = i % 3 === 0 ? w : Math.round(w * 1.8);
    conf += `<i style="left:${(i * 37 + 11) % 100}%;width:${w}px;height:${h}px;background:${colors[i % colors.length]};border-radius:${i % 4 === 0 ? '50%' : '3px'};animation-duration:${(2.4 + (i % 5) * 0.4).toFixed(2)}s;animation-delay:${((i * 0.19) % 2.4).toFixed(2)}s"></i>`;
  }
  const k = item.kid || {};
  fx.innerHTML = `<div class="celebrate" data-fx="close">
    <div class="rays"></div><div class="confetti">${conf}</div>
    <div class="cel-body">
      <div class="cel-yay">יששש!</div>
      <div class="cel-name">כל הכבוד, ${esc(k.name || '')}!</div>
      <div class="cel-avatar">${avatarHTML(k.avatar, 260, 'big')}</div>
      <div class="cel-card">${iconImg(item.iconName || 'star', 54)}
        <div><div class="muted">${esc(item.title || '')}</div><div class="cel-plus">+${item.stars || 1} כוכבים!</div></div>
        ${starPill(k.stars, 'lg')}
      </div>
      <button class="btn yellow big" data-fx="close">יאללה, עוד משימה!</button>
    </div>
  </div>`;
  fx.className = 'open';
  sound('party');
  clearTimeout(nextCelebration.t);
  nextCelebration.t = setTimeout(nextCelebration, 7000);
}
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-fx="close"]')) { clearTimeout(nextCelebration.t); nextCelebration(); }
});

// ---------- misc ----------
export function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'לילה טוב';
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  if (h < 21) return 'ערב טוב';
  return 'לילה טוב';
}
export const todayLabel = () => new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

export function qrSVG(text, cell = 6) {
  if (typeof window.qrcode !== 'function') return '';
  const qr = window.qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: cell, margin: 2, scalable: true });
}
