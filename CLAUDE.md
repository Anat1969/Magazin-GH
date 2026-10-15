# המהות (MAGAZIN-GH)

מגזין שמזקק מחשבה גולמית לכתבה מעוצבת: כותרת, פרקים, ציטוט, "השפעה לעולם" וצילום. הועבר מ-Lovable (Essence Weaver).

## מבנה
- Vite + React + framer-motion, JS ו-CSS רגיל (`src/styles.css`). בלי Tailwind, בלי shadcn ובלי אייקונים.
- ניתוב ב-hash: `#/`, `#/index`, `#/a/<id>`, `#/new`, `#/new/<rootId>`, `#/login`.
- PWA: `public/manifest.webmanifest`, `public/sw.js`, האייקון הוא קשת בלי טקסט.

## Supabase: cultura-GH (ktqmwpbzcnzkhjskqisy), פרויקט משותף
- כל המשאבים עם הקידומת `mahut_`: הטבלאות `mahut_articles` ו-`mahut_admins`, הדלי `mahut-media` והפונקציה `mahut_is_admin()`.
- RLS: כולם קוראים כתבות שפורסמו. כתיבה, עדכון ומחיקה לאדמין בלבד, לפי אימייל בטבלה `mahut_admins`.
- Edge function `mahut-generate`: הטקסט מ-Claude (`ANTHROPIC_API_KEY`), התמונה מ-fal (`FAL_API_KEY`). התמונה נשמרת בדלי כדי שלא תפוג. מותר רק לאדמין.
- `mahut-import`: מייבא חד-פעמי מ-Lovable. הסתיים והושבת, ומחזיר 410.
- MAGAZIN (mduclrkrwrqegmzfwqhz) לא בשימוש, ואין לפתוח אותו.

## כניסה
- Google כבוי ב-cultura-GH. כשהוא כבוי האתר מציג הודעה ושולח קישור כניסה במייל (OTP), בלי סיסמה. כשיופעל, כפתור Google יופיע לבד.

## עבודה
- ענת אישרה מיזוג קבוע ל-main אחרי בדיקה ירוקה.
- Vercel: ענף הייצור הוא main.
- בדיקה: Playwright מול `vite preview`, עם מוקים לכל קריאות Supabase. בבדיקה יש לחסום את ה-service worker (`serviceWorkers: 'block'`), אחרת הוא עוקף את המוקים.
