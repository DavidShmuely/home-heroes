// Data layer: Firestore subscriptions, derived state and all write actions.
import { db, fs, ensureAuth } from './fb.js';
import { STARTER_TASKS, STARTER_REWARDS, CHARACTERS, COLORS } from './assets.js';

const {
  doc, collection, setDoc, addDoc, updateDoc, deleteDoc, getDoc, onSnapshot, query, where,
  serverTimestamp, increment, runTransaction, Timestamp, writeBatch
} = fs;

const LS = {
  get: (k) => { try { return localStorage.getItem('kk.' + k); } catch { return null; } },
  set: (k, v) => { try { v == null ? localStorage.removeItem('kk.' + k) : localStorage.setItem('kk.' + k, v); } catch { /* ignore */ } }
};

export const S = {
  uid: null,
  familyId: LS.get('familyId'),
  role: LS.get('role'),            // 'tablet' | 'parent'
  deviceName: LS.get('deviceName') || '',
  loaded: false,
  family: null,
  members: [],
  kids: [],
  tasks: [],
  rewards: [],
  today: {},                        // taskId -> completion (today)
  todayList: [],                    // all of today's completions
  pending: [],                      // completions awaiting approval (any date)
  redemptions: [],                  // reward requests awaiting approval
  online: navigator.onLine,
  sound: LS.get('sound') !== 'off',
  loadedAt: Date.now()
};

const listeners = new Set();
export const onChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
let scheduled = false;
function emit() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => { scheduled = false; listeners.forEach((fn) => fn('change')); });
}
const celebrateListeners = new Set();
export const onCelebrate = (fn) => celebrateListeners.add(fn);
const lostListeners = new Set();
export const onFamilyLost = (fn) => lostListeners.add(fn);

window.addEventListener('online', () => { S.online = true; emit(); });
window.addEventListener('offline', () => { S.online = false; emit(); });

// ---------- helpers ----------
export function dateKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const fam = (...path) => doc(db, 'families', S.familyId, ...path);
const famCol = (name) => collection(db, 'families', S.familyId, name);
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function randomCode(len) {
  const a = new Uint32Array(len);
  crypto.getRandomValues(a);
  return Array.from(a, (x) => CODE_ALPHABET[x % CODE_ALPHABET.length]).join('');
}
export const normalizeCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
export const prettyCode = (c) => c.length > 6 ? c.match(/.{1,4}/g).join('-') : c.slice(0, 3) + '-' + c.slice(3);

export async function hashPin(pin, salt) {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}
export async function checkPin(pin) {
  if (!S.family) return false;
  return (await hashPin(pin, S.familyId)) === S.family.pinHash;
}

export const kidById = (id) => S.kids.find((k) => k.id === id);
export function tasksForKid(kidId, day = new Date().getDay()) {
  return S.tasks
    .filter((t) => t.kidId === kidId && t.active !== false && (!t.days || t.days.includes(day)))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
export function allTasksForKid(kidId) {
  return S.tasks.filter((t) => t.kidId === kidId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
// 'todo' | 'pending' | 'done'
export function taskState(taskId) {
  const c = S.today[taskId];
  if (!c || c.status === 'rejected') return 'todo';
  return c.status === 'approved' ? 'done' : 'pending';
}
export function level(earned = 0) {
  const per = 25;
  const lvl = Math.floor(earned / per) + 1;
  return { lvl, inLevel: earned % per, per, toNext: per - (earned % per) };
}
export const pendingCount = () => S.pending.length + S.redemptions.length;
export function hasPendingRedemption(kidId, rewardId) {
  return S.redemptions.some((r) => r.kidId === kidId && r.rewardId === rewardId);
}

// ---------- subscriptions ----------
let unsubs = [];
let todayUnsub = null;
let currentDay = dateKey();

function stopAll() {
  unsubs.forEach((u) => u());
  unsubs = [];
  if (todayUnsub) { todayUnsub(); todayUnsub = null; }
}

function listen(ref, onData) {
  const u = onSnapshot(ref, { includeMetadataChanges: false }, onData, (err) => {
    console.error('Snapshot error', err);
    if (err.code === 'permission-denied') familyLost();
  });
  unsubs.push(u);
}

const mapDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

function subscribeToday() {
  if (todayUnsub) todayUnsub();
  currentDay = dateKey();
  const q = query(famCol('completions'), where('date', '==', currentDay));
  todayUnsub = onSnapshot(q, (snap) => {
    const list = mapDocs(snap);
    S.todayList = list;
    S.today = {};
    list.forEach((c) => { if (c.taskId) S.today[c.taskId] = c; });
    snap.docChanges().forEach((ch) => {
      const c = { id: ch.doc.id, ...ch.doc.data() };
      if ((ch.type === 'modified' || ch.type === 'added') && c.status === 'approved' && (c.approvedMs || 0) > S.loadedAt) {
        celebrateListeners.forEach((fn) => fn(c));
      }
    });
    S.loaded = true;
    emit();
  }, (err) => {
    console.error('Today snapshot error', err);
    if (err.code === 'permission-denied') familyLost();
  });
}

export function subscribe() {
  stopAll();
  if (!S.familyId) return;
  S.loadedAt = Date.now();
  listen(fam(), (snap) => {
    if (!snap.exists()) return familyLost();
    S.family = { id: snap.id, ...snap.data() };
    emit();
  });
  listen(famCol('members'), (snap) => { S.members = mapDocs(snap); emit(); });
  listen(famCol('kids'), (snap) => {
    S.kids = mapDocs(snap).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    emit();
  });
  listen(famCol('tasks'), (snap) => { S.tasks = mapDocs(snap); emit(); });
  listen(famCol('rewards'), (snap) => {
    S.rewards = mapDocs(snap).sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0));
    emit();
  });
  listen(query(famCol('completions'), where('status', '==', 'pending')), (snap) => {
    S.pending = mapDocs(snap).sort((a, b) => (a.createdMs || 0) - (b.createdMs || 0));
    emit();
  });
  listen(query(famCol('redemptions'), where('status', '==', 'pending')), (snap) => {
    S.redemptions = mapDocs(snap).sort((a, b) => (a.createdMs || 0) - (b.createdMs || 0));
    emit();
  });
  subscribeToday();
}

// Re-subscribe "today" after midnight.
setInterval(() => {
  if (S.familyId && dateKey() !== currentDay) subscribeToday();
}, 30 * 1000);

function familyLost() {
  stopAll();
  S.family = null;
  lostListeners.forEach((fn) => fn());
}

function saveLocal(familyId, role, name) {
  S.familyId = familyId; S.role = role; S.deviceName = name || '';
  LS.set('familyId', familyId); LS.set('role', role); LS.set('deviceName', S.deviceName);
}
export function clearLocal() {
  stopAll();
  Object.assign(S, { familyId: null, role: null, family: null, members: [], kids: [], tasks: [], rewards: [], today: {}, todayList: [], pending: [], redemptions: [], loaded: false });
  LS.set('familyId', null); LS.set('role', null);
}
export function setSound(on) { S.sound = on; LS.set('sound', on ? 'on' : 'off'); emit(); }

export async function init() {
  const user = await ensureAuth();
  S.uid = user.uid;
  if (S.familyId) subscribe();
  emit();
}

// ---------- family lifecycle ----------
function starterBatch(batch, kidId, mode) {
  (STARTER_TASKS[mode] || STARTER_TASKS.regular).forEach(([ic, title, stars], i) => {
    batch.set(doc(famCol('tasks')), { kidId, title, icon: ic, stars, days: [0, 1, 2, 3, 4, 5, 6], order: i, active: true });
  });
}
function randomAvatar(i) {
  const ch = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)].id;
  return { char: ch, color: i % COLORS.length, acc: 'none' };
}

export async function createFamily({ name, pin, role, deviceName, kids }) {
  const user = await ensureAuth();
  S.uid = user.uid;
  const fref = doc(collection(db, 'families'));
  const recovery = randomCode(12);
  await setDoc(fref, {
    name, ownerUid: user.uid, createdAt: serverTimestamp(),
    pinHash: await hashPin(pin, fref.id),
    jarGoal: 100, jarCurrent: 0, jarTitle: 'פרס משפחתי',
    recoveryCode: recovery
  });
  await setDoc(doc(db, 'families', fref.id, 'members', user.uid), {
    role, name: deviceName || (role === 'tablet' ? 'טאבלט המשפחה' : 'הורה'), joinedAt: serverTimestamp(), owner: true
  });
  S.familyId = fref.id;
  await setDoc(doc(db, 'joinCodes', recovery), {
    familyId: fref.id, kind: 'recovery', expiresAt: Timestamp.fromDate(new Date('2100-01-01'))
  });
  const batch = writeBatch(db);
  kids.forEach((k, i) => {
    const kref = doc(famCol('kids'));
    batch.set(kref, { name: k.name, mode: k.mode, avatar: k.avatar || randomAvatar(i), stars: 0, earned: 0, order: i });
    starterBatch(batch, kref.id, k.mode);
  });
  STARTER_REWARDS.forEach(([ic, title, cost]) => {
    batch.set(doc(famCol('rewards')), { title, icon: ic, cost, active: true });
  });
  await batch.commit();
  saveLocal(fref.id, role, deviceName);
  subscribe();
  return { familyId: fref.id, recovery };
}

export async function joinFamily({ code, role, deviceName }) {
  const user = await ensureAuth();
  S.uid = user.uid;
  const c = normalizeCode(code);
  if (c.length < 6) throw new Error('הקוד קצר מדי');
  const snap = await getDoc(doc(db, 'joinCodes', c));
  if (!snap.exists()) throw new Error('הקוד לא נמצא. בדקו שהוקלד נכון');
  const { familyId, expiresAt } = snap.data();
  if (expiresAt && expiresAt.toMillis() < Date.now()) throw new Error('תוקף הקוד פג. צרו קוד חדש');
  await setDoc(doc(db, 'families', familyId, 'members', user.uid), {
    role, name: deviceName || (role === 'tablet' ? 'טאבלט' : 'הורה'), code: c, joinedAt: serverTimestamp()
  });
  saveLocal(familyId, role, deviceName);
  subscribe();
}

export async function createJoinCode() {
  const code = randomCode(6);
  await setDoc(doc(db, 'joinCodes', code), {
    familyId: S.familyId, kind: 'join', expiresAt: Timestamp.fromMillis(Date.now() + 10 * 60 * 1000)
  });
  return code;
}

export async function leaveFamily() {
  try { await deleteDoc(fam('members', S.uid)); } catch (e) { console.warn(e); }
  clearLocal();
  emit();
}
export const removeMember = (uid) => deleteDoc(fam('members', uid));
export const updateFamily = (data) => updateDoc(fam(), data);
export async function setPin(pin) { await updateDoc(fam(), { pinHash: await hashPin(pin, S.familyId) }); }
export const resetJar = () => updateDoc(fam(), { jarCurrent: 0 });

// ---------- kids / tasks / rewards ----------
export async function addKid({ name, mode }) {
  const batch = writeBatch(db);
  const kref = doc(famCol('kids'));
  const order = S.kids.length;
  batch.set(kref, { name, mode, avatar: randomAvatar(order), stars: 0, earned: 0, order });
  starterBatch(batch, kref.id, mode);
  await batch.commit();
}
export const updateKid = (id, data) => updateDoc(fam('kids', id), data);
export async function deleteKid(id) {
  const batch = writeBatch(db);
  batch.delete(fam('kids', id));
  S.tasks.filter((t) => t.kidId === id).forEach((t) => batch.delete(fam('tasks', t.id)));
  await batch.commit();
}
export function addTask(data) {
  const order = allTasksForKid(data.kidId).length;
  return addDoc(famCol('tasks'), { active: true, order, ...data });
}
export const updateTask = (id, data) => updateDoc(fam('tasks', id), data);
export const deleteTask = (id) => deleteDoc(fam('tasks', id));
export const addReward = (data) => addDoc(famCol('rewards'), { active: true, ...data });
export const updateReward = (id, data) => updateDoc(fam('rewards', id), data);
export const deleteReward = (id) => deleteDoc(fam('rewards', id));

// ---------- kid actions ----------
export function markTask(kid, task) {
  return setDoc(fam('completions', `${dateKey()}_${task.id}`), {
    type: 'task', taskId: task.id, kidId: kid.id, date: dateKey(),
    title: task.title, icon: task.icon, stars: task.stars || 1,
    status: 'pending', createdAt: serverTimestamp(), createdMs: Date.now(), by: S.deviceName || ''
  });
}
export function unmarkTask(task) {
  const c = S.today[task.id];
  if (!c || c.status !== 'pending') return Promise.resolve();
  return deleteDoc(fam('completions', c.id));
}
export function goodDeed(kid) {
  return addDoc(famCol('completions'), {
    type: 'good', kidId: kid.id, date: dateKey(), title: 'מעשה טוב', icon: 'sparkle', stars: 1,
    status: 'pending', createdAt: serverTimestamp(), createdMs: Date.now()
  });
}
export function requestReward(kid, reward) {
  if ((kid.stars || 0) < reward.cost) throw new Error('עוד לא מספיק כוכבים');
  return setDoc(fam('redemptions', `${kid.id}_${reward.id}`), {
    kidId: kid.id, rewardId: reward.id, title: reward.title, icon: reward.icon, cost: reward.cost,
    status: 'pending', createdAt: serverTimestamp(), createdMs: Date.now()
  });
}

// ---------- parent actions ----------
export async function approve(c) {
  const ref = fam('completions', c.id);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists() || snap.data().status !== 'pending') return false;
    const n = snap.data().stars || 1;
    tx.update(ref, { status: 'approved', approvedAt: serverTimestamp(), approvedMs: Date.now(), approvedBy: S.deviceName || '' });
    tx.update(fam('kids', snap.data().kidId), { stars: increment(n), earned: increment(n) });
    tx.update(fam(), { jarCurrent: increment(n) });
    tx.set(doc(famCol('ledger')), { kidId: snap.data().kidId, delta: n, reason: snap.data().title, at: serverTimestamp(), by: S.deviceName || '' });
    return true;
  });
}
export const reject = (c) => updateDoc(fam('completions', c.id), { status: 'rejected', rejectedMs: Date.now() });
export async function approveAll() {
  for (const c of [...S.pending]) {
    try { await approve(c); } catch (e) { console.warn(e); }
  }
}
export async function giveBonus(kid, n = 1, reason = 'כוכב בונוס') {
  const batch = writeBatch(db);
  batch.set(doc(famCol('completions')), {
    type: 'bonus', kidId: kid.id, date: dateKey(), title: reason, icon: 'sparkle', stars: n,
    status: 'approved', createdAt: serverTimestamp(), createdMs: Date.now(),
    approvedAt: serverTimestamp(), approvedMs: Date.now(), approvedBy: S.deviceName || ''
  });
  batch.update(fam('kids', kid.id), { stars: increment(n), earned: increment(n) });
  batch.update(fam(), { jarCurrent: increment(n) });
  batch.set(doc(famCol('ledger')), { kidId: kid.id, delta: n, reason, at: serverTimestamp(), by: S.deviceName || '' });
  await batch.commit();
}
export async function approveRedemption(r) {
  const ref = fam('redemptions', r.id);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists() || snap.data().status !== 'pending') return false;
    const kref = fam('kids', snap.data().kidId);
    const kid = await tx.get(kref);
    if (!kid.exists() || (kid.data().stars || 0) < snap.data().cost) throw new Error('אין מספיק כוכבים');
    tx.update(ref, { status: 'approved', approvedAt: serverTimestamp() });
    tx.update(kref, { stars: increment(-snap.data().cost) });
    tx.set(doc(famCol('ledger')), { kidId: snap.data().kidId, delta: -snap.data().cost, reason: 'פרס: ' + snap.data().title, at: serverTimestamp(), by: S.deviceName || '' });
    return true;
  });
}
export const rejectRedemption = (r) => updateDoc(fam('redemptions', r.id), { status: 'rejected' });
