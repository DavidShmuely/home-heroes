// Static catalog: icons, avatars, colors and starter content.
const I = (n) => `assets/icons/${n}.svg`;
const A = (n) => `assets/avatars/${n}.svg`;

export const ICONS = {
  bed: I('bed'), tooth: I('tooth'), book: I('book'), plate: I('plate'), backpack: I('backpack'),
  heart: I('heart'), toybox: I('toybox'), shirt: I('shirt'), gift: I('gift'), tv: I('tv'),
  icecream: I('icecream'), tree: I('tree'), trophy: I('trophy'), flame: I('flame'),
  sparkle: I('sparkle'), jar: I('jar'), star: I('star'), starEmpty: I('star_empty')
};
export const icon = (name) => ICONS[name] || ICONS.star;

export const TASK_ICONS = ['bed', 'tooth', 'book', 'plate', 'backpack', 'heart', 'toybox', 'shirt', 'tree', 'sparkle', 'gift', 'trophy'];
export const REWARD_ICONS = ['tv', 'icecream', 'plate', 'tree', 'gift', 'trophy', 'book', 'heart', 'toybox', 'sparkle'];

export const CHARACTERS = [
  ['lion', 'אריה'], ['panda', 'פנדה'], ['fox', 'שועל'], ['owl', 'ינשוף'],
  ['dino', 'דינו'], ['robot', 'רובוט'], ['unicorn', 'חד־קרן'], ['cat', 'חתול'],
  ['bunny', 'ארנב'], ['bear', 'דובי'], ['penguin', 'פינגווין'], ['monster', 'מפלצון']
].map(([id, name]) => ({ id, name, src: A(id) }));

// Accessories unlock by total stars ever earned (never spent).
export const ACCESSORIES = [
  { id: 'none', name: 'בלי', src: '', unlock: 0 },
  { id: 'acc_glasses', name: 'משקפיים', src: A('acc_glasses'), unlock: 0 },
  { id: 'acc_bow', name: 'פפיון', src: A('acc_bow'), unlock: 0 },
  { id: 'acc_cap', name: 'כובע', src: A('acc_cap'), unlock: 10 },
  { id: 'acc_party', name: 'כובע מסיבה', src: A('acc_party'), unlock: 30 },
  { id: 'acc_crown', name: 'כתר', src: A('acc_crown'), unlock: 80 }
];

// Light avatar backgrounds; accent = stronger tone for bars/borders.
export const COLORS = [
  { bg: '#FFB4A8', accent: '#FF6B5B', tint: '#FFE3DF', name: 'אדמדם' },
  { bg: '#FFD66B', accent: '#E0A100', tint: '#FFF1CC', name: 'צהוב' },
  { bg: '#9BE8BE', accent: '#2BB673', tint: '#D8F5E6', name: 'ירוק' },
  { bg: '#9CC6FF', accent: '#3B8BFF', tint: '#DDEBFF', name: 'כחול' },
  { bg: '#C9B1FF', accent: '#8E5BEF', tint: '#EBE1FF', name: 'סגול' },
  { bg: '#FFB877', accent: '#FF8A2B', tint: '#FFE6D1', name: 'כתום' },
  { bg: '#FF9EC4', accent: '#E5508A', tint: '#FFE0EC', name: 'ורוד' },
  { bg: '#8EE3E8', accent: '#1FA7B0', tint: '#DDF7F8', name: 'טורקיז' }
];
export const color = (i) => COLORS[(i ?? 0) % COLORS.length];

export const STARTER_TASKS = {
  regular: [
    ['bed', 'סידור המיטה', 1], ['tooth', 'צחצוח שיניים', 1], ['book', 'שיעורי בית', 3],
    ['plate', 'עזרה בשולחן', 2], ['backpack', 'הכנת תיק למחר', 1], ['heart', 'עזרה לאח או אחות', 2]
  ],
  young: [
    ['tooth', 'שיניים', 1], ['shirt', 'להתלבש', 1], ['toybox', 'צעצועים', 1]
  ]
};

export const STARTER_REWARDS = [
  ['tv', 'חצי שעת מסך נוספת', 10], ['plate', 'בוחרים את ארוחת הערב', 15], ['icecream', 'גלידה', 20],
  ['tree', 'יציאה לפארק עם הורה', 40], ['gift', 'הפתעה קטנה', 60], ['trophy', 'פרס גדול', 100]
];

export const DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
