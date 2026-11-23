# גיבורי הבית – אפליקציה משפחתית למשימות ומעשים טובים

אפליקציית WEB (PWA) לטאבלט משפחתי ולטלפונים של ההורים.
- **אחסון האתר:** Firebase Hosting בחינם, עם פריסה אוטומטית מ־GitHub (או GitHub Pages כחלופה).
- **נתונים וסנכרון:** Firebase במסלול **Spark** החינמי. אין בו כרטיס אשראי, ולכן אין שום אפשרות לחיוב.
- **הפרדה:** כל משפחה מבודדת לגמרי, וחוקי האבטחה בקובץ `firestore.rules` אוכפים את זה.
- **התקנה:** אין צורך בחנות אפליקציות ואין צורך בחשבון Google לילדים.

---

## הקמה ראשונה (כ־20 דקות, פעם אחת)

האתר מתארח ב־**Firebase Hosting** (חינם, ה־repository יכול להישאר פרטי). כל `push` לענף `main` מעלה אוטומטית את האתר **ואת חוקי האבטחה**, דרך GitHub Actions.

### 1. יוצרים פרויקט Firebase
1. נכנסים ל־https://console.firebase.google.com ולוחצים **Create a project**. אפשר לוותר על Google Analytics.
2. הפרויקט נוצר במסלול **Spark** (חינמי). **לא** משדרגים ל־Blaze.
3. רושמים בצד את ה־**Project ID**, שמופיע ב־Project settings (למשל `home-heroes-1a2b3`).

### 2. מפעילים כניסה אנונימית
1. בתפריט: **Build › Authentication › Get started**.
2. בלשונית **Sign-in method** בוחרים **Anonymous**, מסמנים **Enable** ושומרים.

### 3. יוצרים מסד נתונים
1. בתפריט: **Build › Firestore Database › Create database**.
2. בוחרים מיקום קרוב (למשל `europe-west`) ו־**Production mode**.

את החוקים לא צריך להדביק: הם יעלו אוטומטית בפריסה הראשונה.

### 4. רושמים אפליקציית Web ומפעילים Hosting
1. בגלגל השיניים בוחרים **Project settings**, ותחת **Your apps** לוחצים על אייקון ה־Web (`</>`).
2. נותנים שם, מסמנים **Also set up Firebase Hosting** ולוחצים **Register app**.
3. בשלבים הבאים של האשף לוחצים **Next** עד הסוף. לא צריך להתקין כלום.

> פרטי ה־config נטענים אוטומטית מ־Firebase Hosting, ולא צריך להדביק אותם ב־`js/config.js`.

### 5. יוצרים חשבון שירות לפריסה
1. נכנסים ל־https://console.cloud.google.com/iam-admin/serviceaccounts ובוחרים את הפרויקט למעלה.
2. לוחצים **Create service account**, בשם `github-deploy`, ולוחצים **Create and continue**.
3. ב־Role בוחרים **Firebase Admin**, ולוחצים **Continue** ואז **Done**.
4. לוחצים על החשבון שנוצר, נכנסים ללשונית **Keys** ובוחרים **Add key › Create new key › JSON**. קובץ יורד למחשב.

### 6. מחברים את GitHub
ב־repository נכנסים ל־**Settings › Secrets and variables › Actions**:
1. בלשונית **Secrets** לוחצים **New repository secret**:
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Secret: כל התוכן של קובץ ה־JSON שירד
2. (לא חובה) בלשונית **Variables** אפשר להגדיר `FIREBASE_PROJECT_ID`. ברירת המחדל היא `home-heroes-9d7c3`.
3. **מוחקים את קובץ ה־JSON מהמחשב.** זה מפתח רגיש.

### 7. פריסה ראשונה
1. ב־repository נכנסים ל־**Actions** ובוחרים **Deploy to Firebase**.
2. לוחצים **Run workflow** (בהמשך זה ירוץ לבד בכל push).
3. כשמופיע ✓ ירוק, האתר זמין בכתובת: `https://home-heroes-9d7c3.web.app`

**אם הפריסה נכשלת:**
- **הודעה על `serviceusage`:** מוסיפים לחשבון השירות גם את התפקיד **Service Usage Consumer**, ומריצים שוב.
- **הודעה על Firestore:** מוודאים ששלב 3 בוצע.

### אחסון חלופי: GitHub Pages
אם ה־repository ציבורי, אפשר לוותר על שלבים 5–7:
1. מדביקים את ה־config ב־`js/config.js`.
2. מפעילים **Settings › Pages** מענף `main`.
3. מדביקים ידנית את `firestore.rules` ב־**Firestore › Rules**.
4. מוסיפים את הדומיין של GitHub Pages ב־**Authentication › Settings › Authorized domains**.

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
(להרצה מקומית מדביקים את ה־config ב־`js/config.js`. ב־Firebase, `localhost` מאושר כברירת מחדל.)

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
firestore.rules       security rules (deployed automatically)
firebase.json         Firebase Hosting + rules config
.github/workflows/    auto-deploy on push to main
css/app.css           all styles
js/config.js          Firebase config (auto on Firebase Hosting)
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
