// Kid personal page (regular 6–12 and "young" 3–5 picture mode), rewards shop and avatar picker.
import * as D from '../data.js';
import { esc, avatarHTML, starPill, starImg, iconImg, svg, toast, sound, speak } from '../ui.js';
import { color, icon, CHARACTERS, COLORS, ACCESSORIES } from '../assets.js';
import { tapTask } from './home.js';

const notFound = () => `<main class="center-screen"><h1>לא מצאנו את הילד</h1><a class="btn purple" href="#/">חזרה הביתה</a></main>`;

function nextGoal(kid) {
  const r = D.S.rewards.filter((x) => x.active !== false);
  if (!r.length) return null;
  return r.find((x) => x.cost > (kid.stars || 0)) || r[r.length - 1];
}

// ---------- regular kid page ----------
function regular(kid) {
  const c = color(kid.avatar?.color);
  const lv = D.level(kid.earned || 0);
  const tasks = D.tasksForKid(kid.id);
  const goal = nextGoal(kid);
  const goalPct = goal ? Math.min(100, Math.round((100 * (kid.stars || 0)) / goal.cost)) : 0;
  const cards = tasks.map((t) => {
    const st = D.taskState(t.id);
    const foot = st === 'done' ? `<div class="tstate done">${svg.check} אושר!</div>`
      : st === 'pending' ? `<button class="tstate pending" data-act="tap" data-task="${t.id}">${svg.clock} מחכה לאישור · ביטול</button>`
        : `<button class="btn purple tbtn" data-act="tap" data-task="${t.id}">עשיתי!</button>`;
    return `<div class="tcard ${st}">
      <div class="tc-top"><span class="tc-icon">${iconImg(t.icon, 54)}</span><span class="plus">+${t.stars || 1}</span></div>
      <div class="tc-title">${esc(t.title)}</div>${foot}</div>`;
  }).join('');
  return `<main class="kid" style="--tint:${c.tint};--accent:${c.accent}">
    <header class="kid-head">
      <a class="round-btn" href="#/" aria-label="חזרה למסך הבית">${svg.back}</a>
      <a class="av-edit" href="#/avatar/${kid.id}" aria-label="החלפת דמות">${avatarHTML(kid.avatar, 92)}<span class="edit-badge">${svg.edit}</span></a>
      <div class="kid-hello">
        <h1>היי ${esc(kid.name)}!</h1>
        <div class="level"><span>רמה ${lv.lvl}</span><div class="bar"><i style="width:${Math.round((100 * lv.inLevel) / lv.per)}%"></i></div><small>עוד ${lv.toNext} כוכבים לרמה ${lv.lvl + 1}</small></div>
      </div>
      <div class="star-box">${starImg(40)}<b>${kid.stars || 0}</b><small>הכוכבים שלי</small></div>
    </header>
    <div class="kid-body">
      <section class="tgrid-wrap"><h2>המשימות שלי היום</h2>
        <div class="tgrid">${cards || '<div class="free-day big">אין משימות היום – יום חופשי!</div>'}</div>
      </section>
      <aside class="kid-side">
        ${goal ? `<div class="card goal"><div class="muted">המטרה שלי</div>
          <div class="goal-row">${iconImg(goal.icon, 56)}<b>${esc(goal.title)}</b></div>
          <div class="bar thick"><i style="width:${goalPct}%"></i></div>
          <div class="goal-txt">${(kid.stars || 0) >= goal.cost ? 'יש לך מספיק! אפשר לקנות' : `${kid.stars || 0} / ${goal.cost} · עוד ${goal.cost - (kid.stars || 0)} כוכבים!`}</div>
          <a class="btn dark" href="#/rewards/${kid.id}">לחנות הפרסים</a></div>` : ''}
        <div class="card good">
          <div class="good-head">${iconImg('sparkle', 34)}<b>עשיתי מעשה טוב!</b></div>
          <p>משהו טוב שלא ברשימה? ספרו להורה וקבלו כוכב בונוס.</p>
          <button class="btn green" data-act="good">לספר להורה</button>
        </div>
      </aside>
    </div>
  </main>`;
}

// ---------- young kid page ----------
function young(kid) {
  const c = color(kid.avatar?.color);
  const tasks = D.tasksForKid(kid.id);
  const n = Math.min(kid.stars || 0, 10);
  const stars = Array.from({ length: 10 }, (_, i) => `<img src="${icon(i < n ? 'star' : 'starEmpty')}" alt="" width="46" height="46">`).join('');
  const tiles = tasks.map((t) => {
    const st = D.taskState(t.id);
    const badge = st === 'done' ? `<span class="ybadge done">${svg.check} כל הכבוד!</span>`
      : st === 'pending' ? `<span class="ybadge pending">${svg.clock} אבא ואמא בודקים</span>` : '<span class="ybadge todo">לוחצים כשסיימתי</span>';
    return `<button class="ytile ${st}" data-act="ytap" data-task="${t.id}" aria-label="${esc(t.title)}">
      <span class="ycirc">${iconImg(t.icon, 130)}</span><span class="ytitle">${esc(t.title)}</span>${badge}</button>`;
  }).join('');
  return `<main class="young" style="--tint:${c.tint};--accent:${c.accent}">
    <header class="young-head">
      <a class="round-btn" href="#/" aria-label="חזרה למסך הבית">${svg.back}</a>
      <a href="#/avatar/${kid.id}" aria-label="החלפת דמות">${avatarHTML(kid.avatar, 100)}</a>
      <h1>${esc(kid.name)}</h1>
      <div class="ystars" role="img" aria-label="${kid.stars || 0} כוכבים">${stars}${(kid.stars || 0) > 10 ? `<b>+${kid.stars - 10}</b>` : ''}</div>
    </header>
    <section class="ygrid">${tiles || '<div class="free-day big">יום חופשי!</div>'}</section>
    <div class="center-row"><button class="btn white" data-act="read">${svg.speaker} מה צריך לעשות?</button>
    <a class="btn white" href="#/rewards/${kid.id}">${iconImg('gift', 30)} פרסים</a></div>
  </main>`;
}

export const kid = {
  render([id]) {
    const k = D.kidById(id);
    if (!k) return notFound();
    return k.mode === 'young' ? young(k) : regular(k);
  },
  actions: {
    tap: (el, e, [id]) => tapTask(id, el.dataset.task),
    ytap: (el, e, [id]) => {
      const t = D.S.tasks.find((x) => x.id === el.dataset.task);
      if (t && D.taskState(t.id) === 'todo') speak(`כל הכבוד! ${t.title}`);
      tapTask(id, el.dataset.task);
    },
    read: (el, e, [id]) => {
      const left = D.tasksForKid(id).filter((t) => D.taskState(t.id) === 'todo').map((t) => t.title);
      speak(left.length ? 'עוד נשאר: ' + left.join(', ') : 'סיימת הכול! כל הכבוד!');
    },
    good: async (el, e, [id]) => {
      try { await D.goodDeed(D.kidById(id)); sound('tap'); toast('יופי! הבקשה נשלחה להורה'); } catch (err) { toast('לא הצלחנו לשלוח', 'err'); }
    }
  }
};

// ---------- rewards shop ----------
export const rewards = {
  render([id]) {
    const k = D.kidById(id);
    if (!k) return notFound();
    const stars = k.stars || 0;
    const list = D.S.rewards.filter((r) => r.active !== false).map((r) => {
      const pending = D.hasPendingRedemption(k.id, r.id);
      const can = stars >= r.cost;
      const foot = pending ? `<div class="tstate pending">${svg.clock} מחכה לאישור הורה</div>`
        : can ? `<button class="btn purple" data-act="buy" data-r="${r.id}">אני רוצה!</button>`
          : `<div class="lockbar"><div class="bar"><i style="width:${Math.round((100 * stars) / r.cost)}%"></i></div><b>עוד ${r.cost - stars} כוכבים</b></div>`;
      return `<div class="rcard ${can || pending ? '' : 'locked'}">
        <div class="tc-top"><span class="tc-icon">${iconImg(r.icon, 60)}</span><span class="cost">${starImg(24)}${r.cost}</span></div>
        <div class="tc-title">${esc(r.title)}</div>${foot}</div>`;
    }).join('');
    return `<main class="shop">
      <header class="shop-head">
        <a class="round-btn" href="#/kid/${k.id}" aria-label="חזרה">${svg.back}</a>
        <div><h1>חנות הפרסים</h1><div class="muted">${esc(k.name)} · מה בא לך לקנות בכוכבים?</div></div>
        <div class="star-box row">${starImg(38)}<b>${stars}</b></div>
      </header>
      <section class="rgrid">${list || '<div class="free-day big">עוד אין פרסים. ההורים מוסיפים אותם במצב הורה.</div>'}</section>
    </main>`;
  },
  actions: {
    buy: async (el, e, [id]) => {
      const k = D.kidById(id); const r = D.S.rewards.find((x) => x.id === el.dataset.r);
      try { await D.requestReward(k, r); sound('tap'); toast(`בחרת: ${r.title}. הורה יאשר בקרוב!`); }
      catch (err) { toast(err.message || 'שגיאה', 'err'); }
    }
  }
};

// ---------- avatar picker ----------
const drafts = {};
export const avatar = {
  render([id]) {
    const k = D.kidById(id);
    if (!k) return notFound();
    const d = drafts[id] || (drafts[id] = { char: 'lion', color: 0, acc: 'none', ...(k.avatar || {}) });
    const earned = k.earned || 0;
    const ch = CHARACTERS.find((c) => c.id === d.char) || CHARACTERS[0];
    const acc = ACCESSORIES.find((a) => a.id === d.acc) || ACCESSORIES[0];
    return `<main class="avatar-pick">
      <header class="shop-head">
        <a class="round-btn" href="#/kid/${k.id}" aria-label="חזרה">${svg.back}</a>
        <div><h1>מי אני?</h1><div class="muted">בוחרים דמות, צבע ותוספת מגניבה</div></div>
        <button class="btn yellow pop" data-act="shuffle">${svg.dice} תפתיעו אותי!</button>
      </header>
      <div class="ap-body">
        <section class="card ap-preview">
          <h2>${esc(k.name)}</h2>
          ${avatarHTML(d, 300, 'big ring')}
          <div class="chip">${esc(ch.name)}${acc.src ? ' + ' + esc(acc.name) : ''}</div>
          <button class="btn purple big pop" data-act="save">זה אני!</button>
        </section>
        <section class="card ap-options">
          <h3>1 · הדמות שלי</h3>
          <div class="opt-grid">${CHARACTERS.map((c) => `<button class="opt ${c.id === d.char ? 'on' : ''}" data-act="char" data-v="${c.id}" aria-pressed="${c.id === d.char}" aria-label="${c.name}">
            ${avatarHTML({ ...d, char: c.id, acc: 'none' }, 76)}<span>${c.name}</span></button>`).join('')}</div>
          <h3>2 · הצבע שלי</h3>
          <div class="swatches">${COLORS.map((c, i) => `<button class="swatch ${i === d.color ? 'on' : ''}" style="background:${c.bg}" data-act="color" data-v="${i}" aria-pressed="${i === d.color}" aria-label="${c.name}"></button>`).join('')}</div>
          <h3>3 · תוספת מגניבה</h3>
          <div class="opt-grid acc">${ACCESSORIES.map((a) => {
            const locked = earned < a.unlock;
            return `<button class="opt ${a.id === d.acc ? 'on' : ''} ${locked ? 'locked' : ''}" data-act="acc" data-v="${a.id}" aria-pressed="${a.id === d.acc}" aria-label="${a.name}${locked ? ', נפתח ב־' + a.unlock + ' כוכבים' : ''}">
              ${a.src ? `<img src="${a.src}" alt="" width="64" height="64">` : `<span class="none-ic">${svg.x}</span>`}<span>${a.name}</span>
              ${locked ? `<span class="lock-tag">${svg.lock}${a.unlock}</span>` : ''}</button>`;
          }).join('')}</div>
          <p class="muted small">תוספות נעולות נפתחות כשצוברים מספיק כוכבים (בסך הכול, גם אם כבר קניתם בהם פרסים).</p>
        </section>
      </div>
    </main>`;
  },
  actions: {
    char: (el, e, [id]) => { drafts[id].char = el.dataset.v; sound('tap'); rerenderNow(); },
    color: (el, e, [id]) => { drafts[id].color = +el.dataset.v; rerenderNow(); },
    acc: (el, e, [id]) => {
      const a = ACCESSORIES.find((x) => x.id === el.dataset.v);
      if ((D.kidById(id).earned || 0) < a.unlock) return toast(`נפתח כשתצברו ${a.unlock} כוכבים`);
      drafts[id].acc = a.id; rerenderNow();
    },
    shuffle: (el, e, [id]) => {
      const earned = D.kidById(id).earned || 0;
      const free = ACCESSORIES.filter((a) => earned >= a.unlock);
      drafts[id] = {
        char: CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)].id,
        color: Math.floor(Math.random() * COLORS.length),
        acc: free[Math.floor(Math.random() * free.length)].id
      };
      sound('tap'); rerenderNow();
    },
    save: async (el, e, [id]) => {
      try {
        await D.updateKid(id, { avatar: drafts[id] });
        delete drafts[id];
        sound('party'); toast('איזה יופי!');
        location.hash = '#/kid/' + id;
      } catch (err) { toast('לא הצלחנו לשמור', 'err'); }
    }
  }
};

let rerenderNow = () => {};
export const setKidRerender = (fn) => { rerenderNow = fn; };
