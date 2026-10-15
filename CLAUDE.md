# המהות (MAGAZIN-GH)

מגזין שמזקק מחשבה גולמית לכתבה מעוצבת: כותרת, פרקים, ציטוט, "השפעה לעולם" וצילום. הועבר מ-Lovable (Essence Weaver).

## מבנה
- Vite + React + framer-motion, JS ו-CSS רגיל (`src/styles.css`). בלי Tailwind, בלי shadcn ובלי אייקונים.
- ניתוב ב-hash: `#/`, `#/index`, `#/a/<id>`, `#/new`, `#/new/<rootId>`, `#/login`.
- PWA: `public/manifest.webmanifest`, `public/sw.js`, האייקון הוא קשת בלי טקסט.

## Supabase: cultura-GH (ktqmwpbzcnzkhjskqisy), פרויקט משותף
- כל המשאבים עם הקידומת `mahut_`: הטבלאות `mahut_articles` ו-`mahut_admins`, הדלי `mahut-media` והפונקציה `mahut_is_admin()`.
- RLS: כולם קוראים כתבות שפורסמו. כתיבה, עדכון ומחיקה לאדמין בלבד, לפי אימייל בטבלה `mahut_admins`.
- Edge function `mahut-generate` (המקור ב-`supabase/functions/mahut-generate`): הטקסט מ-Claude (`ANTHROPIC_API_KEY`), התמונה מ-fal (`FAL_API_KEY`). התמונה נשמרת בדלי כדי שלא תפוג. מותר רק לאדמין.
- `mahut-import`: מייבא חד-פעמי מ-Lovable. הסתיים והושבת, ומחזיר 410.
- MAGAZIN (mduclrkrwrqegmzfwqhz) לא בשימוש, ואין לפתוח אותו.

## הערות של ענת (לא לחזור עליהן)
- השער צריך להיות מקצועי: עומק, שקיפויות ושכבות זכוכית, קומפוזיציה נקייה על גריד, תמונה מלאה עם קווי בנייה.
- כל כפתורי ההגדרות (העתקת קישור, שיחת הפיתוח, התקנה, כניסה ויציאה, כתבה חדשה) נמצאים בתפריט שנפתח מכפתור הלוגו האישי של ענת (`public/anat-logo.png`, ה-A). אין כפתורי הגדרות פזורים בסרגל.
- דף השער מסביר מה המגזין ומה הוא עושה (סעיף "על המגזין" וארבעת השלבים).
- לכל סדרה יש הסבר על הקשר בין החלקים: `series_note` בכתבת השורש, ו-`bridge` בכל חלק המשך. הפונקציה `mahut-generate` כותבת את שניהם בכל כתבת המשך, ואפשר לערוך אותם במצב עריכה.

## כניסה
- Google כבוי ב-cultura-GH. כשהוא כבוי האתר מציג הודעה ושולח קישור כניסה במייל (OTP), בלי סיסמה. כשיופעל, כפתור Google יופיע לבד.

## עבודה
- ענת אישרה מיזוג קבוע ל-main אחרי בדיקה ירוקה.
- Vercel: ענף הייצור הוא main.
- בדיקה: Playwright מול `vite preview`, עם מוקים לכל קריאות Supabase. בבדיקה יש לחסום את ה-service worker (`serviceWorkers: 'block'`), אחרת הוא עוקף את המוקים.
