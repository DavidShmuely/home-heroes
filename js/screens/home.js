// Main family screen: one column per kid with today's tasks.
import * as D from '../data.js';
import { esc, avatarHTML, starPill, iconImg, svg, greeting, todayLabel, toast, sound, pinPad, closeModal, speak } from '../ui.js';
import { color } from '../assets.js';
import { unlockParent, isParentUnlocked } from '../session.js';

export function taskRow(kid, t) {
  const st = D.taskState(t.id);
  const mark = st === 'done' ? `<span class="st done">${svg.check}</span>`
    : st === 'pending' ? `<span class="st pending">${svg.clock}</span>` : '<span class="st todo"></span>';
  const label = st === 'done' ? 'בוצע' : st === 'pending' ? 'מחכה לאישור' : 'לחצו כשסיימתם';
  return `<button class="trow ${st}" data-act="tap" data-kid="${kid.id}" data-task="${t.id}" aria-label="${esc(t.title)} – ${label}">
    ${iconImg(t.icon, 40)}<span class="ttl">${esc(t.title)}</span>${mark}</button>`;
}

// Big picture tile for young kids (3–5) on the family screen.
function youngTile(kid, t) {
  const st = D.taskState(t.id);
  const mark = st === 'done' ? `<span class="st done">${svg.check}</span>`
    : st === 'pending' ? `<span class="st pending">${svg.clock}</span>` : '';
  const label = st === 'done' ? 'בוצע' : st === 'pending' ? 'מחכה לאישור' : 'לחצו כשסיימתם';
  return `<button class="ytrow ${st}" data-act="tap" data-kid="${kid.id}" data-task="${t.id}" aria-label="${esc(t.title)} – ${label}">
    <span class="yt-ic">${iconImg(t.icon, 64)}</span><span class="yt-ttl">${esc(t.title)}</span>${mark}</button>`;
}

function kidColumn(kid) {
  const tasks = D.tasksForKid(kid.id);
  const done = tasks.filter((t) => D.taskState(t.id) === 'done').length;
  const all = tasks.length > 0 && done === tasks.length;
  const c = color(kid.avatar?.color);
  const pct = tasks.length ? Math.round((100 * done) / tasks.length) : 0;
  return `<article class="kcol ${all ? 'all-done' : ''}" style="--tint:${c.tint};--accent:${all ? '#2BB673' : c.accent}">
    <a class="khead" href="#/kid/${kid.id}" aria-label="המסך של ${esc(kid.name)}">
      <span class="av-wrap">${avatarHTML(kid.avatar, 74)}${all ? '<img class="crown" src="assets/avatars/acc_crown.svg" alt="">' : ''}</span>
      <span class="kname">${esc(kid.name)}</span>
      ${starPill(kid.stars)}
    </a>
    <div class="kprog"><div class="bar"><i style="width:${pct}%"></i></div><b>${all ? 'הכל!' : `${done}/${tasks.length}`}</b></div>
    <div class="tlist ${kid.mode === 'young' ? 'ylist' : ''}">${tasks.map((t) => (kid.mode === 'young' ? youngTile(kid, t) : taskRow(kid, t))).join('') || '<div class="free-day">יום חופשי!</div>'}</div>
  </article>`;
}

export const home = {
  render() {
    const f = D.S.family || {};
    const kids = D.S.kids;
    const pend = D.pendingCount();
    const isPhone = D.S.role === 'parent';
    const jarPct = Math.min(100, Math.round((100 * (f.jarCurrent || 0)) / (f.jarGoal || 100)));
    const jarFull = (f.jarCurrent || 0) >= (f.jarGoal || 100);
    return `<main class="home ${isPhone ? 'phone' : ''}">
      <header class="topbar">
        <img src="assets/icons/star.svg" alt="" width="58" height="58" class="mascot">
        <div class="hello"><h1>${greeting()}, ${esc(f.name || 'משפחה')}!</h1><div class="muted">${todayLabel()}<span class="hint"> · לוחצים על משימה כשמסיימים</span></div></div>
        ${D.S.online ? '' : `<span class="offline">${svg.wifiOff} אין חיבור – נשמר ויסונכרן</span>`}
        <button class="btn white parent-btn" data-act="parent">${svg.lock} <span class="lbl-txt">${isPhone ? 'ניהול' : 'הורים'}</span>${pend ? `<span class="badge">${pend}</span>` : ''}</button>
      </header>
      ${isPhone && pend ? `<a class="pending-banner" href="#/parent/approvals">${svg.clock} ${pend} מחכים לאישור שלך – לחצו לאישור</a>` : ''}
      ${kids.length ? `<section class="kgrid cols-${Math.min(kids.length, 6)}">${kids.map(kidColumn).join('')}</section>`
        : `<section class="empty"><img src="assets/icons/toybox.svg" alt="" width="100" height="100"><p>עוד אין ילדים. הוסיפו אותם במצב הורה › ילדים.</p></section>`}
      <footer class="jar ${jarFull ? 'full' : ''}">
        <img src="assets/icons/jar.svg" alt="" width="52" height="52">
        <b>צנצנת המשפחה</b>
        <div class="bar"><i style="width:${jarPct}%"></i></div>
        <span>${jarFull ? 'הצנצנת מלאה! ' : ''}${f.jarCurrent || 0} מתוך ${f.jarGoal || 100} · פרס: ${esc(f.jarTitle || '')}</span>
      </footer>
    </main>`;
  },
  actions: {
    tap: (el) => tapTask(el.dataset.kid, el.dataset.task),
    parent: () => openParent()
  }
};

export async function tapTask(kidId, taskId) {
  const kid = D.kidById(kidId);
  const task = D.S.tasks.find((t) => t.id === taskId);
  if (!kid || !task) return;
  const st = D.taskState(task.id);
  try {
    if (st === 'todo') {
      sound('tap');
      if (kid.mode === 'young') speak(`כל הכבוד! ${task.title}`);
      await D.markTask(kid, task);
      toast(`כל הכבוד ${kid.name}! נשלח לאישור הורה`);
    } else if (st === 'pending') {
      sound('undo');
      await D.unmarkTask(task);
      toast('בוטל');
    } else {
      toast('כבר אושר – מעולה!');
    }
  } catch (e) {
    console.error(e); toast('לא הצלחנו לשמור', 'err');
  }
}

export function openParent(target = '#/parent/approvals') {
  if (D.S.role === 'parent' || isParentUnlocked()) { location.hash = target; return; }
  pinPad({
    title: 'קוד הורה',
    onDone: async (pin) => {
      if (await D.checkPin(pin)) { unlockParent(); closeModal(); location.hash = target; return true; }
      return false;
    }
  });
}
