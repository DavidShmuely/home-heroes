// Welcome, create-family wizard, join-by-code, and "not configured" screens.
import * as D from '../data.js';
import { esc, toast, avatarHTML, iconImg } from '../ui.js';
import { CHARACTERS, COLORS } from '../assets.js';

// ---------- welcome ----------
export const welcome = {
  render: () => `<main class="center-screen">
    <img class="bounce" src="assets/icons/star.svg" alt="" width="140" height="140">
    <h1 class="hero-title">גיבורי הבית</h1>
    <p class="lead">עושים משימות ומעשים טובים, אוספים כוכבים,<br>וקונים בהם פרסים שווים!</p>
    <div class="stack-btns">
      <a class="btn purple big" href="#/create">יצירת משפחה חדשה</a>
      <a class="btn white big" href="#/join">הצטרפות למשפחה קיימת</a>
    </div>
  </main>`,
  actions: {}
};

// ---------- create wizard ----------
const W = { step: 1, name: '', role: 'tablet', deviceName: '', pin: '', kids: [], recovery: '', busy: false };
export const resetWizard = () => Object.assign(W, { step: 1, name: '', role: 'tablet', deviceName: '', pin: '', kids: [], recovery: '', busy: false });

function steps() {
  return `<div class="steps" aria-label="שלב ${W.step} מתוך 3">${[1, 2, 3].map((i) => `<span class="${i <= W.step ? 'on' : ''}"></span>`).join('')}</div>`;
}

function roleCards(selected) {
  return `<fieldset class="role-cards"><legend>המכשיר הזה הוא...</legend>
    <label class="role-card ${selected === 'tablet' ? 'on' : ''}">
      <input type="radio" name="role" value="tablet" ${selected === 'tablet' ? 'checked' : ''}>
      ${iconImg('toybox', 52)}<span><b>הטאבלט של הילדים</b><small>מסך משותף שפתוח תמיד</small></span>
    </label>
    <label class="role-card ${selected === 'parent' ? 'on' : ''}">
      <input type="radio" name="role" value="parent" ${selected === 'parent' ? 'checked' : ''}>
      ${iconImg('heart', 52)}<span><b>טלפון של הורה</b><small>אישורים וניהול</small></span>
    </label>
  </fieldset>`;
}

export const create = {
  render() {
    if (W.step === 1) return `<main class="wizard"><a class="back-link" href="#/">ביטול</a>${steps()}
      <h1>יוצרים משפחה</h1>
      <form data-submit="step1" class="form">
        <label>שם המשפחה<input name="name" required maxlength="40" value="${esc(W.name)}" placeholder="למשל: משפחת כהן"></label>
        ${roleCards(W.role)}
        <label class="parent-only ${W.role === 'parent' ? '' : 'hidden'}">איך לקרוא לך?<input name="deviceName" maxlength="20" value="${esc(W.deviceName)}" placeholder="אבא / אמא"></label>
        <button class="btn purple big">המשך</button>
      </form></main>`;
    if (W.step === 2) return `<main class="wizard"><button class="back-link" data-act="back">חזרה</button>${steps()}
      <h1>קוד הורה</h1>
      <p class="lead">4 ספרות שרק ההורים יודעים. הקוד פותח את מצב ההורה בטאבלט.</p>
      <form data-submit="step2" class="form">
        <label>קוד הורה<input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required autocomplete="new-password" class="pin-input"></label>
        <label>שוב, לאימות<input name="pin2" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required autocomplete="new-password" class="pin-input"></label>
        <button class="btn purple big">המשך</button>
      </form></main>`;
    if (W.step === 3) return `<main class="wizard wide"><button class="back-link" data-act="back">חזרה</button>${steps()}
      <h1>מי הילדים?</h1>
      <p class="lead">לכל ילד נכין משימות ופרסים לדוגמה. אפשר לשנות הכול אחר כך.</p>
      <div class="kid-chips">${W.kids.map((k, i) => `<div class="kid-chip">${avatarHTML(k.avatar, 48)}<span><b>${esc(k.name)}</b><small>${k.mode === 'young' ? 'קטנטנים 3–5' : 'גילאי 6–12'}</small></span>
        <button type="button" class="icon-btn" data-act="removeKid" data-i="${i}" aria-label="הסרת ${esc(k.name)}">✕</button></div>`).join('') || '<div class="muted">עוד לא הוספתם ילדים</div>'}</div>
      ${W.kids.length < 8 ? `<form data-submit="addKid" class="form inline-form">
        <label>שם<input name="kname" required maxlength="20" placeholder="שם הילד"></label>
        <fieldset class="seg"><legend>גיל</legend>
          <label><input type="radio" name="mode" value="young"> 3–5</label>
          <label><input type="radio" name="mode" value="regular" checked> 6–12</label>
        </fieldset>
        <button class="btn white">הוספה</button>
      </form>` : ''}
      <button class="btn purple big" data-act="finish" ${W.kids.length && !W.busy ? '' : 'disabled'}>${W.busy ? 'יוצרים...' : 'סיימנו!'}</button>
    </main>`;
    return `<main class="center-screen">
      <img class="bounce" src="assets/icons/trophy.svg" alt="" width="120" height="120">
      <h1>המשפחה מוכנה!</h1>
      <p class="lead">זה <b>קוד השחזור</b> שלכם. צלמו או רשמו אותו: בעזרתו אפשר לחבר מחדש מכשיר אם הכול נמחק.</p>
      <div class="code-box" dir="ltr">${esc(D.prettyCode(W.recovery))}</div>
      <p class="muted">אפשר למצוא אותו גם במצב הורה › הגדרות.</p>
      <button class="btn purple big" data-act="enter">יאללה, מתחילים!</button>
    </main>`;
  },
  actions: {
    back: () => { W.step = Math.max(1, W.step - 1); rerender(); },
    step1: (form, fd) => {
      W.name = fd.get('name').trim(); W.role = fd.get('role') || 'tablet'; W.deviceName = (fd.get('deviceName') || '').trim();
      W.step = 2; rerender();
    },
    step2: (form, fd) => {
      if (fd.get('pin') !== fd.get('pin2')) return toast('הקודים לא תואמים', 'err');
      if (!/^\d{4}$/.test(fd.get('pin'))) return toast('הקוד צריך להיות 4 ספרות', 'err');
      W.pin = fd.get('pin'); W.step = 3; rerender();
    },
    addKid: (form, fd) => {
      const i = W.kids.length;
      W.kids.push({
        name: fd.get('kname').trim(), mode: fd.get('mode'),
        avatar: { char: CHARACTERS[(i * 5 + 3) % CHARACTERS.length].id, color: i % COLORS.length, acc: 'none' }
      });
      rerender();
      setTimeout(() => document.querySelector('input[name="kname"]')?.focus(), 30);
    },
    removeKid: (el) => { W.kids.splice(+el.dataset.i, 1); rerender(); },
    finish: async () => {
      if (W.busy) return;
      W.busy = true; rerender();
      try {
        const { recovery } = await D.createFamily({ name: W.name, pin: W.pin, role: W.role, deviceName: W.deviceName, kids: W.kids });
        W.recovery = recovery; W.step = 4;
      } catch (e) {
        console.error(e); toast('משהו השתבש: ' + (e.message || e), 'err');
      }
      W.busy = false; rerender();
    },
    enter: () => { resetWizard(); location.hash = '#/'; }
  },
  onInput(e) {
    if (e.target.name === 'role') {
      W.role = e.target.value;
      document.querySelectorAll('.role-card').forEach((c) => c.classList.toggle('on', c.querySelector('input').checked));
      document.querySelector('.parent-only')?.classList.toggle('hidden', W.role !== 'parent');
    }
  },
  isDone: () => W.step === 4
};

// ---------- join ----------
const J = { role: 'tablet', busy: false };
export const join = {
  render(params) {
    const code = params[0] ? D.normalizeCode(params[0]) : '';
    return `<main class="wizard"><a class="back-link" href="#/">ביטול</a>
      <img src="assets/icons/star.svg" alt="" width="80" height="80" class="center-img">
      <h1>מצטרפים למשפחה</h1>
      <p class="lead">את הקוד מוצאים במכשיר שכבר מחובר: מצב הורה › מכשירים.</p>
      <form data-submit="join" class="form">
        <label>קוד הצטרפות<input name="code" required dir="ltr" autocapitalize="characters" autocomplete="off" class="code-input" value="${esc(code ? D.prettyCode(code) : '')}" placeholder="ABC-123"></label>
        ${roleCards(J.role)}
        <label class="parent-only ${J.role === 'parent' ? '' : 'hidden'}">איך לקרוא לך?<input name="deviceName" maxlength="20" placeholder="אבא / אמא"></label>
        <button class="btn purple big" ${J.busy ? 'disabled' : ''}>${J.busy ? 'מתחברים...' : 'הצטרפות'}</button>
      </form></main>`;
  },
  actions: {
    join: async (form, fd) => {
      J.busy = true; rerender();
      try {
        await D.joinFamily({ code: fd.get('code'), role: fd.get('role') || 'tablet', deviceName: (fd.get('deviceName') || '').trim() });
        toast('הצטרפתם! ברוכים הבאים');
        location.hash = '#/';
      } catch (e) {
        console.error(e);
        toast(e.code === 'permission-denied' ? 'הקוד לא תקף' : (e.message || 'שגיאה'), 'err');
      }
      J.busy = false; rerender();
    }
  },
  onInput(e) {
    if (e.target.name === 'role') {
      J.role = e.target.value;
      document.querySelectorAll('.role-card').forEach((c) => c.classList.toggle('on', c.querySelector('input').checked));
      document.querySelector('.parent-only')?.classList.toggle('hidden', J.role !== 'parent');
    }
  }
};

let rerender = () => {};
export const setRerender = (fn) => { rerender = fn; };
