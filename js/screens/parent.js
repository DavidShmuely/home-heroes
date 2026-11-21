// Parent mode: approvals, kids, tasks, rewards, devices and settings.
import * as D from '../data.js';
import { esc, avatarHTML, iconImg, svg, toast, openModal, closeModal, qrSVG, celebrate, starPill } from '../ui.js';
import { TASK_ICONS, REWARD_ICONS, DAYS } from '../assets.js';
import { lockParent } from '../session.js';

const TABS = [
  ['approvals', 'אישורים'], ['kids', 'ילדים'], ['tasks', 'משימות'],
  ['rewards', 'פרסים'], ['devices', 'מכשירים'], ['settings', 'הגדרות']
];
const P = { taskKid: null, code: null, codeExp: 0 };

function shell(tab, body) {
  const pend = D.pendingCount();
  return `<main class="parent">
    <header class="parent-head">
      <span class="lock-ic">${svg.lock}</span><h1>מצב הורה</h1>
      <nav class="tabs" aria-label="ניווט הורה">${TABS.map(([id, label]) => `<a href="#/parent/${id}" class="${id === tab ? 'on' : ''}" ${id === tab ? 'aria-current="page"' : ''}>${label}${id === 'approvals' && pend ? ` · ${pend}` : ''}</a>`).join('')}</nav>
      <button class="btn white" data-act="exit">${D.S.role === 'parent' ? 'למסך הילדים' : 'נעילה וחזרה'}</button>
    </header>
    <div class="parent-body">${body}</div>
  </main>`;
}
const kidName = (id) => D.kidById(id)?.name || '?';
const iconPicker = (list, sel, name = 'icon') => `<div class="icon-pick">${list.map((ic) => `<label><input type="radio" name="${name}" value="${ic}" ${ic === sel ? 'checked' : ''}><span>${iconImg(ic, 44)}</span></label>`).join('')}</div>`;

// ---------- approvals ----------
function approvals() {
  const items = D.S.pending.map((c) => {
    const k = D.kidById(c.kidId);
    return `<div class="arow">
      ${avatarHTML(k?.avatar, 56)}
      <div class="grow"><b>${esc(k?.name || '?')} · ${esc(c.title)}</b><small class="muted">${c.date !== D.dateKey() ? 'מ־' + c.date : 'היום'}${c.by ? ' · ' + esc(c.by) : ''}</small></div>
      <span class="plus">+${c.stars || 1}</span>
      <button class="btn ghost" data-act="reject" data-id="${c.id}">לא עכשיו</button>
      <button class="btn green" data-act="approve" data-id="${c.id}">אישור</button>
    </div>`;
  }).join('');
  const reds = D.S.redemptions.map((r) => {
    const k = D.kidById(r.kidId);
    return `<div class="arow reward">
      ${avatarHTML(k?.avatar, 56)}
      <div class="grow"><b>${esc(k?.name || '?')} רוצה: ${esc(r.title)}</b><small class="muted">יתרה: ${k?.stars || 0} כוכבים</small></div>
      <span class="minus">−${r.cost}</span>
      <button class="btn ghost" data-act="rejectR" data-id="${r.id}">לא עכשיו</button>
      <button class="btn green" data-act="approveR" data-id="${r.id}">אישור</button>
    </div>`;
  }).join('');
  const bonus = D.S.kids.map((k) => `<button class="bonus-kid" data-act="bonus" data-id="${k.id}" aria-label="כוכב בונוס ל${esc(k.name)}">${avatarHTML(k.avatar, 56)}<span>${esc(k.name)}</span></button>`).join('');
  return `<div class="cols">
    <section class="card grow">
      <div class="row-between"><h2>ממתין לאישור</h2>${D.S.pending.length > 1 ? '<button class="btn green" data-act="approveAll">אשר הכל</button>' : ''}</div>
      ${items || reds ? items + reds : '<div class="empty small"><img src="assets/icons/trophy.svg" alt="" width="70" height="70"><p>אין בקשות פתוחות. הכול מאושר!</p></div>'}
    </section>
    <aside class="side">
      <section class="card"><h2>${iconImg('sparkle', 28)} כוכב על מעשה טוב</h2><p class="muted">ראיתם משהו טוב? לחיצה = כוכב בונוס וחגיגה.</p><div class="bonus-grid">${bonus}</div></section>
      <section class="card dark"><h2>היום בבית</h2>
        <div class="stats"><div><b>${D.S.todayList.filter((c) => c.status === 'approved').length}</b><span>אושרו היום</span></div>
        <div><b>${D.S.todayList.filter((c) => c.status === 'approved').reduce((s, c) => s + (c.stars || 0), 0)}</b><span>כוכבים היום</span></div></div>
      </section>
    </aside>
  </div>`;
}

// ---------- kids ----------
function kids() {
  return `<section class="card">
    <div class="row-between"><h2>הילדים</h2><button class="btn purple" data-act="addKid">${svg.plus} הוספת ילד</button></div>
    <div class="list">${D.S.kids.map((k) => `<div class="lrow">${avatarHTML(k.avatar, 56)}
      <div class="grow"><b>${esc(k.name)}</b><small class="muted">${k.mode === 'young' ? 'מצב קטנטנים (3–5)' : 'גילאי 6–12'} · רמה ${D.level(k.earned || 0).lvl}</small></div>
      ${starPill(k.stars)}
      <button class="btn ghost" data-act="adjust" data-id="${k.id}">תיקון כוכבים</button>
      <button class="btn white" data-act="editKid" data-id="${k.id}">${svg.edit} עריכה</button></div>`).join('') || '<p class="muted">עוד אין ילדים.</p>'}</div>
  </section>`;
}
function kidForm(k = {}) {
  return `<form data-msubmit="saveKid" class="form"><h2>${k.id ? 'עריכת ' + esc(k.name) : 'ילד חדש'}</h2>
    <input type="hidden" name="id" value="${k.id || ''}">
    <label>שם<input name="name" required maxlength="20" value="${esc(k.name || '')}"></label>
    <fieldset class="seg"><legend>תצוגה</legend>
      <label><input type="radio" name="mode" value="young" ${k.mode === 'young' ? 'checked' : ''}> קטנטנים 3–5 (תמונות גדולות)</label>
      <label><input type="radio" name="mode" value="regular" ${k.mode !== 'young' ? 'checked' : ''}> גילאי 6–12</label>
    </fieldset>
    ${k.id ? '' : '<p class="muted small">נוסיף משימות לדוגמה שמתאימות לגיל.</p>'}
    <div class="row-between">${k.id ? `<button type="button" class="btn danger" data-mact="delKid" data-id="${k.id}">מחיקה</button>` : '<span></span>'}
    <span class="row"><button type="button" class="btn ghost" data-mact="__close">ביטול</button><button class="btn purple">שמירה</button></span></div>
  </form>`;
}

// ---------- tasks ----------
function tasks() {
  const kidsList = D.S.kids;
  if (!kidsList.length) return '<section class="card"><p class="muted">קודם מוסיפים ילדים.</p></section>';
  if (!P.taskKid || !D.kidById(P.taskKid)) P.taskKid = kidsList[0].id;
  const list = D.allTasksForKid(P.taskKid);
  return `<section class="card">
    <div class="chips">${kidsList.map((k) => `<button class="chip-btn ${k.id === P.taskKid ? 'on' : ''}" data-act="pickKid" data-id="${k.id}">${avatarHTML(k.avatar, 34)}${esc(k.name)}</button>`).join('')}</div>
    <div class="row-between"><h2>המשימות של ${esc(kidName(P.taskKid))}</h2><button class="btn purple" data-act="addTask">${svg.plus} משימה חדשה</button></div>
    <div class="list">${list.map((t) => `<div class="lrow ${t.active === false ? 'off' : ''}">${iconImg(t.icon, 48)}
      <div class="grow"><b>${esc(t.title)}</b><small class="muted">${(t.days && t.days.length < 7) ? 'ימים: ' + t.days.map((d) => DAYS[d]).join(' ') : 'כל יום'}${t.active === false ? ' · מושבתת' : ''}</small></div>
      <span class="plus">+${t.stars || 1}</span>
      <button class="btn white" data-act="editTask" data-id="${t.id}">${svg.edit} עריכה</button></div>`).join('') || '<p class="muted">אין משימות עדיין.</p>'}</div>
  </section>`;
}
function taskForm(t = {}) {
  const days = t.days || [0, 1, 2, 3, 4, 5, 6];
  return `<form data-msubmit="saveTask" class="form"><h2>${t.id ? 'עריכת משימה' : 'משימה חדשה'} · ${esc(kidName(t.kidId || P.taskKid))}</h2>
    <input type="hidden" name="id" value="${t.id || ''}">
    <label>שם המשימה<input name="title" required maxlength="30" value="${esc(t.title || '')}" placeholder="למשל: סידור החדר"></label>
    <div class="lbl">אייקון</div>${iconPicker(TASK_ICONS, t.icon || 'star')}
    <label>כמה כוכבים?<select name="stars">${[1, 2, 3, 4, 5].map((n) => `<option ${n === (t.stars || 1) ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <div class="lbl">באילו ימים?</div>
    <div class="days">${DAYS.map((d, i) => `<label><input type="checkbox" name="days" value="${i}" ${days.includes(i) ? 'checked' : ''}><span>${d}</span></label>`).join('')}</div>
    <label class="check"><input type="checkbox" name="active" ${t.active === false ? '' : 'checked'}> פעילה</label>
    <div class="row-between">${t.id ? `<button type="button" class="btn danger" data-mact="delTask" data-id="${t.id}">מחיקה</button>` : '<span></span>'}
    <span class="row"><button type="button" class="btn ghost" data-mact="__close">ביטול</button><button class="btn purple">שמירה</button></span></div>
  </form>`;
}

// ---------- rewards ----------
function rewardsTab() {
  return `<section class="card">
    <div class="row-between"><h2>פרסים</h2><button class="btn purple" data-act="addReward">${svg.plus} פרס חדש</button></div>
    <div class="list">${D.S.rewards.map((r) => `<div class="lrow ${r.active === false ? 'off' : ''}">${iconImg(r.icon, 48)}
      <div class="grow"><b>${esc(r.title)}</b>${r.active === false ? '<small class="muted">מוסתר</small>' : ''}</div>
      ${starPill(r.cost)}<button class="btn white" data-act="editReward" data-id="${r.id}">${svg.edit} עריכה</button></div>`).join('') || '<p class="muted">אין פרסים עדיין.</p>'}</div>
  </section>`;
}
function rewardForm(r = {}) {
  return `<form data-msubmit="saveReward" class="form"><h2>${r.id ? 'עריכת פרס' : 'פרס חדש'}</h2>
    <input type="hidden" name="id" value="${r.id || ''}">
    <label>שם הפרס<input name="title" required maxlength="30" value="${esc(r.title || '')}"></label>
    <div class="lbl">אייקון</div>${iconPicker(REWARD_ICONS, r.icon || 'gift')}
    <label>מחיר בכוכבים<input name="cost" type="number" min="1" max="1000" required value="${r.cost || 10}"></label>
    <label class="check"><input type="checkbox" name="active" ${r.active === false ? '' : 'checked'}> מוצג בחנות</label>
    <div class="row-between">${r.id ? `<button type="button" class="btn danger" data-mact="delReward" data-id="${r.id}">מחיקה</button>` : '<span></span>'}
    <span class="row"><button type="button" class="btn ghost" data-mact="__close">ביטול</button><button class="btn purple">שמירה</button></span></div>
  </form>`;
}

// ---------- devices ----------
function joinUrl(code) { return `${location.origin}${location.pathname}#/join/${code}`; }
function devices() {
  const valid = P.code && Date.now() < P.codeExp;
  const mins = valid ? Math.max(1, Math.round((P.codeExp - Date.now()) / 60000)) : 0;
  return `<div class="cols">
    <section class="card qr-card">
      <h2>חיבור מכשיר חדש</h2>
      ${valid ? `<div class="qr">${qrSVG(joinUrl(P.code))}<img class="qr-star" src="assets/icons/star.svg" alt=""></div>
        <div class="muted">סורקים במצלמה של הטלפון, או מקלידים:</div>
        <div class="code-box" dir="ltr">${D.prettyCode(P.code)}</div>
        <div class="muted small">${svg.clock} בתוקף עוד כ־${mins} דקות</div>
        <button class="btn ghost" data-act="newCode">קוד חדש</button>`
      : `<p class="muted">יוצרים קוד חד־פעמי ל־10 דקות, וסורקים אותו מהמכשיר החדש.</p><button class="btn purple big" data-act="newCode">יצירת קוד חיבור</button>`}
      <ol class="howto"><li>סורקים את הקוד בטלפון</li><li>בוחרים: טלפון הורה או טאבלט</li><li>בטלפון: שיתוף › ״הוסף למסך הבית״</li></ol>
    </section>
    <section class="card grow"><h2>מכשירים מחוברים · ${D.S.members.length}</h2>
      <div class="list">${D.S.members.map((m) => `<div class="lrow">${iconImg(m.role === 'tablet' ? 'toybox' : 'heart', 44)}
        <div class="grow"><b>${esc(m.name || (m.role === 'tablet' ? 'טאבלט' : 'הורה'))}${m.id === D.S.uid ? ' (המכשיר הזה)' : ''}</b><small class="muted">${m.role === 'tablet' ? 'טאבלט ילדים' : 'טלפון הורה'}${m.owner ? ' · יוצר המשפחה' : ''}</small></div>
        ${m.id === D.S.uid ? '' : `<button class="btn ghost" data-act="removeMember" data-id="${m.id}" aria-label="הסרת המכשיר">${svg.x} הסרה</button>`}</div>`).join('')}</div>
    </section>
  </div>`;
}

// ---------- settings ----------
function settings() {
  const f = D.S.family || {};
  return `<div class="cols">
    <section class="card grow">
      <form data-submit="saveFamily" class="form"><h2>המשפחה</h2>
        <label>שם המשפחה<input name="name" required maxlength="40" value="${esc(f.name || '')}"></label>
        <label>הפרס של צנצנת המשפחה<input name="jarTitle" maxlength="40" value="${esc(f.jarTitle || '')}"></label>
        <label>כמה כוכבים ממלאים את הצנצנת?<input name="jarGoal" type="number" min="10" max="5000" value="${f.jarGoal || 100}"></label>
        <div class="row"><button class="btn purple">שמירה</button><button type="button" class="btn ghost" data-act="resetJar">ריקון הצנצנת (${f.jarCurrent || 0})</button></div>
      </form>
    </section>
    <aside class="side">
      <section class="card"><h2>קוד הורה</h2><button class="btn white" data-act="changePin">שינוי קוד הורה</button></section>
      <section class="card"><h2>צלילים</h2><label class="check"><input type="checkbox" data-act="toggleSound" ${D.S.sound ? 'checked' : ''}> צלילים במכשיר הזה</label></section>
      <section class="card"><h2>קוד שחזור</h2><p class="muted small">מחבר מחדש מכשיר בכל עת. שמרו אותו במקום בטוח.</p><div class="code-box small" dir="ltr">${esc(D.prettyCode(f.recoveryCode || ''))}</div></section>
      <section class="card"><button class="btn danger" data-act="leave">ניתוק המכשיר הזה מהמשפחה</button></section>
    </aside>
  </div>`;
}

const VIEWS = { approvals, kids, tasks, rewards: rewardsTab, devices, settings };

const run = async (fn, ok) => {
  try { const r = await fn(); if (ok) toast(ok); return r; }
  catch (e) { console.error(e); toast(e.message && /[א-ת]/.test(e.message) ? e.message : 'הפעולה נכשלה – בדקו חיבור', 'err'); }
};

export const parent = {
  render([tab = 'approvals']) {
    const view = VIEWS[tab] || approvals;
    return shell(VIEWS[tab] ? tab : 'approvals', view());
  },
  actions: {
    exit: () => { lockParent(); location.hash = '#/'; },
    approve: (el) => {
      const c = D.S.pending.find((x) => x.id === el.dataset.id);
      if (c) run(() => D.approve(c), `אושר! +${c.stars || 1} ל${kidName(c.kidId)}`);
    },
    reject: (el) => { const c = D.S.pending.find((x) => x.id === el.dataset.id); if (c) run(() => D.reject(c)); },
    approveAll: () => run(() => D.approveAll(), 'הכול אושר!'),
    approveR: (el) => { const r = D.S.redemptions.find((x) => x.id === el.dataset.id); if (r) run(() => D.approveRedemption(r), 'הפרס אושר. תהנו!'); },
    rejectR: (el) => { const r = D.S.redemptions.find((x) => x.id === el.dataset.id); if (r) run(() => D.rejectRedemption(r)); },
    bonus: (el) => { const k = D.kidById(el.dataset.id); if (k) run(() => D.giveBonus(k, 1, 'מעשה טוב'), `כוכב בונוס ל${k.name}!`); },

    addKid: () => openModal(kidForm(), kidModalActions),
    editKid: (el) => openModal(kidForm(D.kidById(el.dataset.id)), kidModalActions),
    adjust: (el) => {
      const k = D.kidById(el.dataset.id);
      openModal(`<form data-msubmit="adjust" class="form"><h2>תיקון כוכבים · ${esc(k.name)}</h2>
        <p class="muted small">לתיקון טעויות בלבד. מספר חיובי מוסיף, שלילי מוריד.</p>
        <label>שינוי<input name="delta" type="number" required value="1"></label>
        <div class="row"><button type="button" class="btn ghost" data-mact="__close">ביטול</button><button class="btn purple">עדכון</button></div></form>`, {
        adjust: (form, fd) => {
          const n = parseInt(fd.get('delta'), 10) || 0;
          closeModal();
          run(() => D.updateKid(k.id, { stars: Math.max(0, (k.stars || 0) + n) }), 'עודכן');
        }
      });
    },
    pickKid: (el) => { P.taskKid = el.dataset.id; rerender(); },
    addTask: () => openModal(taskForm({ kidId: P.taskKid }), taskModalActions),
    editTask: (el) => openModal(taskForm(D.S.tasks.find((t) => t.id === el.dataset.id)), taskModalActions),
    addReward: () => openModal(rewardForm(), rewardModalActions),
    editReward: (el) => openModal(rewardForm(D.S.rewards.find((r) => r.id === el.dataset.id)), rewardModalActions),

    newCode: async () => {
      const code = await run(() => D.createJoinCode());
      if (code) { P.code = code; P.codeExp = Date.now() + 10 * 60 * 1000; rerender(); }
    },
    removeMember: (el) => {
      if (confirm('להסיר את המכשיר? הוא יצטרך קוד חדש כדי להתחבר שוב.')) run(() => D.removeMember(el.dataset.id), 'המכשיר הוסר');
    },
    saveFamily: (form, fd) => run(() => D.updateFamily({
      name: fd.get('name').trim(), jarTitle: fd.get('jarTitle').trim(), jarGoal: Math.max(10, parseInt(fd.get('jarGoal'), 10) || 100)
    }), 'נשמר'),
    resetJar: () => { if (confirm('לרוקן את צנצנת המשפחה?')) run(() => D.resetJar(), 'הצנצנת רוקנה. מתחילים מחדש!'); },
    toggleSound: (el) => D.setSound(el.checked),
    changePin: () => openModal(`<form data-msubmit="pin" class="form"><h2>קוד הורה חדש</h2>
      <label>קוד חדש<input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required class="pin-input"></label>
      <label>שוב<input name="pin2" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required class="pin-input"></label>
      <div class="row"><button type="button" class="btn ghost" data-mact="__close">ביטול</button><button class="btn purple">שמירה</button></div></form>`, {
      pin: (form, fd) => {
        if (fd.get('pin') !== fd.get('pin2')) return toast('הקודים לא תואמים', 'err');
        closeModal(); run(() => D.setPin(fd.get('pin')), 'הקוד עודכן');
      }
    }),
    leave: () => {
      if (confirm('לנתק את המכשיר הזה? כדי לחבר אותו שוב תצטרכו קוד הצטרפות או קוד שחזור.')) {
        run(async () => { await D.leaveFamily(); location.hash = '#/'; });
      }
    }
  }
};

const kidModalActions = {
  saveKid: (form, fd) => {
    const id = fd.get('id'); const data = { name: fd.get('name').trim(), mode: fd.get('mode') };
    closeModal();
    run(() => id ? D.updateKid(id, data) : D.addKid(data), 'נשמר');
  },
  delKid: (el) => {
    if (!confirm('למחוק את הילד ואת כל המשימות שלו?')) return;
    closeModal(); run(() => D.deleteKid(el.dataset.id), 'נמחק');
  }
};
const taskModalActions = {
  saveTask: (form, fd) => {
    const id = fd.get('id');
    const days = fd.getAll('days').map(Number);
    if (!days.length) return toast('בחרו לפחות יום אחד', 'err');
    const data = { title: fd.get('title').trim(), icon: fd.get('icon') || 'star', stars: parseInt(fd.get('stars'), 10) || 1, days, active: fd.get('active') === 'on' };
    closeModal();
    run(() => id ? D.updateTask(id, data) : D.addTask({ ...data, kidId: P.taskKid }), 'נשמר');
  },
  delTask: (el) => { if (confirm('למחוק את המשימה?')) { closeModal(); run(() => D.deleteTask(el.dataset.id), 'נמחק'); } }
};
const rewardModalActions = {
  saveReward: (form, fd) => {
    const id = fd.get('id');
    const data = { title: fd.get('title').trim(), icon: fd.get('icon') || 'gift', cost: Math.max(1, parseInt(fd.get('cost'), 10) || 10), active: fd.get('active') === 'on' };
    closeModal();
    run(() => id ? D.updateReward(id, data) : D.addReward(data), 'נשמר');
  },
  delReward: (el) => { if (confirm('למחוק את הפרס?')) { closeModal(); run(() => D.deleteReward(el.dataset.id), 'נמחק'); } }
};

let rerender = () => {};
export const setParentRerender = (fn) => { rerender = fn; };
export { celebrate };
