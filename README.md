# גיבורי הבית – אפליקציה משפחתית למשימות ומעשים טובים

אפליקציית WEB (PWA) לטאבלט משפחתי ולטלפונים של ההורים.
- **אחסון האתר:** GitHub Pages, בחינם.
- **נתונים וסנכרון:** Firebase במסלול **Spark** החינמי. אין בו כרטיס אשראי, ולכן אין שום אפשרות לחיוב.
- **הפרדה:** כל משפחה מבודדת לגמרי, וחוקי האבטחה בקובץ `firestore.rules` אוכפים את זה.
- **התקנה:** אין צורך בחנות אפליקציות ואין צורך בחשבון Google לילדים.

---

## הקמה ראשונה (כ־15 דקות, פעם אחת)

### 1. יוצרים פרויקט Firebase
1. נכנסים ל־https://console.firebase.google.com ולוחצים **Create a project**. אפשר לוותר על Google Analytics.
2. הפרויקט נוצר במסלול **Spark** (חינמי). **לא** משדרגים ל־Blaze.

### 2. מפעילים כניסה אנונימית
1. בתפריט: **Build › Authentication › Get started**.
2. בלשונית **Sign-in method** בוחרים **Anonymous**, מסמנים **Enable** ושומרים.

### 3. יוצרים מסד נתונים
1. בתפריט: **Build › Firestore Database › Create database**.
2. בוחרים מיקום קרוב (למשל `europe-west`) ו־**Production mode**.
3. בלשונית **Rules** מוחקים את מה שיש, מדביקים את כל התוכן של הקובץ `firestore.rules` ולוחצים **Publish**.

### 4. מחברים את הקוד לפרויקט
1. לוחצים על גלגל השיניים, ואז **Project settings**.
2. תחת **Your apps** לוחצים על אייקון ה־Web (`</>`), נותנים שם ולוחצים **Register**.
3. מעתיקים את הערכים מתוך `firebaseConfig` לקובץ `js/config.js`, במקום כל ה־`PASTE_...`.
   > הערכים האלה אינם סוד. האבטחה מגיעה מחוקי Firestore.

### 5. מעלים ל־GitHub Pages
1. יוצרים repository חדש ב־GitHub, למשל `home-heros`, ומעלים אליו את כל הקבצים, כולל הקובץ `.nojekyll`.
2. נכנסים ל־**Settings › Pages**, בוחרים **Deploy from a branch** ו־`main` / `(root)`, ושומרים.
3. אחרי דקה־שתיים האתר זמין בכתובת: `https://<שם-המשתמש>.github.io/home-heros/`

### 6. מאשרים את הדומיין ב־Firebase
ב־**Authentication › Settings › Authorized domains** לוחצים **Add domain** ומוסיפים `<שם-המשתמש>.github.io`.

---

## שימוש

### הטאבלט המשפחתי
1. פותחים את הכתובת בכרום ולוחצים **יצירת משפחה חדשה**.
2. בוחרים ״הטאבלט של הילדים״, קובעים קוד הורה בן 4 ספרות ומוסיפים את הילדים.
3. **שומרים את קוד השחזור** שמוצג בסוף.
4. מומלץ להתקין את **Fully Kiosk Browser** (אנדרואיד) ולהגדיר בו:
   - Start URL: הכתובת של האתר
   - Keep Screen On: מופעל
   - Kiosk Mode: מופעל, כדי שהילדים לא יצאו מהאפליקציה

### טלפון של הורה
1. בטאבלט: **הורים**, מקלידים את הקוד, ואז **מכשירים › יצירת קוד חיבור**.
2. סורקים את ה־QR מהטלפון ובוחרים **טלפון של הורה**.
3. מתקינים למסך הבית:
   - **אייפון:** בתוך Safari לוחצים שיתוף › **הוסף למסך הבית**.
   - **אנדרואיד:** בתפריט כרום לוחצים **התקן אפליקציה**.

### משפחה אחרת רוצה להשתמש?
שולחים להם את הקישור, והם לוחצים **יצירת משפחה חדשה**. כל משפחה נפרדת לגמרי.

---

## איך זה עובד

| פעולה | מי |
|---|---|
| ילד לוחץ על משימה: היא עוברת ל״מחכה לאישור״ (לחיצה נוספת מבטלת) | הילד בטאבלט |
| אישור או דחייה, אישור הכל, כוכב בונוס | הורה: בטלפון, או בטאבלט עם קוד הורה |
| אישור משימה: הכוכבים מתווספים, ובטאבלט קופצת חגיגה | אוטומטי |
| ילד מבקש פרס: אחרי אישור ההורה הכוכבים יורדים | הילד, ואז ההורה |
| כל כוכב שמאושר נכנס גם ל״צנצנת המשפחה״ המשותפת | אוטומטי |

- **רמות:** כל 25 כוכבים שנצברו הם רמה חדשה. תוספות לדמות (כובע, כתר) נפתחות לפי סך הכוכבים שנצברו, גם אם כבר הוצאו על פרסים.
- **מצב קטנטנים (3–5):** אריחי תמונה גדולים, הקראה בקול ושורת כוכבים במקום מספרים.
- **עבודה בלי אינטרנט:** הטאבלט ממשיך לעבוד, והשינויים מסתנכרנים כשהחיבור חוזר. אישורים של הורה דורשים חיבור.
- **מעבר יום:** המשימות מתאפסות אוטומטית בחצות. אפשר לקבוע לכל משימה באילו ימים היא מופיעה.

---

## עדכון גרסה
1. משנים את הקבצים ב־GitHub.
2. מעלים את מספר הגרסה בשורה הראשונה של `sw.js`, למשל `home-heroes-v2`.

המכשירים יקבלו את הגרסה החדשה בפתיחה הבאה.

## הרצה מקומית לבדיקה
```bash
python3 -m http.server 8080
# then open http://localhost:8080
```
(ב־Firebase, `localhost` מאושר כברירת מחדל.)

---

## מגבלות וחשוב לדעת
- **מכסות המסלול החינמי** (יומיות, משותפות לכל המשפחות בפרויקט): כ־50 אלף קריאות ו־20 אלף כתיבות. זה מספיק לעשרות משפחות. אם עוברים את המכסה, השירות נעצר עד מחר, ואין חיוב. מעקב: **Firestore › Usage**.
- **אין התראות פוש** בגרסה הזו. בקשות פתוחות מופיעות כשפותחים את האפליקציה בטלפון, ובטאבלט מופיע מספר על כפתור ״הורים״.
- **קוד ההורה** הוא נעילה נגד ילדים, לא אבטחה. ההגנה האמיתית על הנתונים היא ההפרדה בין משפחות.
- **פרטיות:** נשמרים רק שם פרטי ודמות מצוירת. לא נשמרות תמונות, תאריכי לידה או פרטים מזהים.
- **מכשיר שאיבד את החיבור:** אם ניקו את נתוני הדפדפן, מצטרפים מחדש עם קוד הצטרפות או עם קוד השחזור.

## מבנה הקבצים
```
index.html            app entry
manifest.webmanifest  PWA manifest
sw.js                 offline cache
firestore.rules       security rules (paste into Firebase)
css/app.css           all styles
js/config.js          your Firebase config  <-- edit
js/fb.js              Firebase init
js/data.js            data model + actions
js/ui.js              shared UI (avatars, modal, PIN, sounds, celebration)
js/screens/*.js       screens
js/vendor/qrcode.js   QR generator (MIT, Kazuhiko Arase)
assets/               cartoon icons, avatars, app icons
```

### מבנה הנתונים ב־Firestore
```
joinCodes/{code}                 { familyId, kind: join|recovery, expiresAt }
families/{fid}                   { name, ownerUid, pinHash, jarGoal, jarCurrent, jarTitle, recoveryCode }
  members/{uid}                  { role: tablet|parent, name }
  kids/{kidId}                   { name, mode: young|regular, avatar{char,color,acc}, stars, earned, order }
  tasks/{taskId}                 { kidId, title, icon, stars, days[0-6], active, order }
  rewards/{rewardId}             { title, icon, cost, active }
  completions/{date_taskId|auto} { kidId, taskId?, type: task|good|bonus, date, title, icon, stars, status }
  redemptions/{kidId_rewardId}   { kidId, rewardId, title, cost, status }
  ledger/{auto}                  { kidId, delta, reason, at }
```
