// Parent-mode unlock on shared tablets (auto-locks after inactivity).
const IDLE_MS = 3 * 60 * 1000;
let unlockedUntil = 0;

export const isParentUnlocked = () => Date.now() < unlockedUntil;
export const unlockParent = () => { unlockedUntil = Date.now() + IDLE_MS; };
export const lockParent = () => { unlockedUntil = 0; };

['pointerdown', 'keydown'].forEach((ev) => document.addEventListener(ev, () => {
  if (isParentUnlocked()) unlockedUntil = Date.now() + IDLE_MS;
}, { passive: true }));
