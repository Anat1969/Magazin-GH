import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { go, seriesOf } from '../data';
import { supabase } from '../supabase';

const PHASES = ['מזקק את המהות המילולית', 'בונה את מבנה הכתבה', 'מצלם את המרחב', 'מעמד את הכפולה'];
const FOLLOW_PHASES = ['קושר קצוות של מחשבה', 'בונה גשר מהחלק הקודם', 'מצלם את המרחב', 'מעמד את הכפולה'];

// Starting points the editor can click to fill the field.
const SEEDS = [
  ['תצפית מהעיר', 'בבוקר ראיתי חזית ישנה שכל חלונותיה נסגרו חוץ מאחד. דווקא החלון הפתוח היחיד גרם לכל הבניין להיראות חי.'],
  ['שאלה מקצועית', 'למה כיכר ריקה מרגישה לפעמים מזמינה ולפעמים מאיימת? מה בכל זאת קובע את ההבדל?'],
  ['משפט מספר', '"הפחות הוא יותר" נשמע כמו כלל עיצובי, אבל אולי הוא בעיקר כלל של קשב.'],
  ['רגע אישי', 'סידרתי את שולחן העבודה והשארתי עליו רק עיפרון ודף. פתאום היה לי קל יותר להתחיל.'],
];

const INPUTS = [
  ['מקור ההשראה', 'מחשבה של העורכת: תצפית בעיר, שאלה מהעבודה, משפט מספר, רגע מסיור או שיחה. משהו שעוד לא סודר.'],
  ['קלט', 'טקסט חופשי, ממשפט אחד ועד כמה פסקאות. כל אחד יכול לכתוב, בלי כניסה. בכתבת המשך, הקלט הוא התהייה שהכתבה הקודמת עוררה.'],
  ['העיבוד', 'בלחיצה על הכפתור המואר, Claude מזקק את המחשבה למבנה של כתבה, ו-fal מצלם עבורה תצלום אדריכלי. זה לוקח כדקה.'],
  ['פלט', 'כתבה מלאה שמתפרסמת מיד במגזין, ואפשר לערוך או להסתיר אותה מתוך הדף.'],
];

const ANATOMY = [
  ['נושא', 'אחד משישת נושאי המגזין'],
  ['כותרת וכותרת משנה', 'שם קצר ומשפט שפותח את הרעיון'],
  ['ציטוט', 'משפט אחד לשוליים'],
  ['3 עד 4 פרקים', 'כל פרק עם כותרת ודימוי מוחשי'],
  ['השפעה לעולם', 'פעולה אחת לשבוע הקרוב'],
  ['תצלום', 'תצלום אדריכלי שנוצר לכתבה'],
  ['גשר והסבר סדרה', 'רק בכתבת המשך'],
];

function HowItWorks() {
  return (
    <aside className="how" aria-label="איך נוצרת כתבה">
      <span className="mono kicker">איך נוצרת כתבה</span>
      <ol className="how__flow">
        {INPUTS.map(([title, text], i) => (
          <li key={title}>
            <span className="how__num">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="how__anatomy">
        <span className="mono">מה יוצא: מבנה הכתבה</span>
        <dl>
          {ANATOMY.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  );
}

export default function Compose({ rootId, articles, onToast, reload }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState(0);
  const root = rootId ? articles.find((a) => a.id === rootId) : null;
  const series = root ? seriesOf(root, articles) : [];
  const phases = root ? FOLLOW_PHASES : PHASES;

  useEffect(() => {
    if (!busy) return;
    setPhase(0);
    const t = setInterval(() => setPhase((p) => Math.min(p + 1, phases.length - 1)), 9000);
    return () => clearInterval(t);
  }, [busy, phases.length]);

  const submit = async () => {
    const input = text.trim();
    if (!input || busy) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('mahut-generate', { body: { input, rootId } });
    if (error || data?.error) {
      let msg = data?.error;
      if (!msg && error?.context?.json) msg = (await error.context.json().catch(() => null))?.error;
      setBusy(false);
      onToast(msg || 'היצירה נכשלה. נסו שוב.');
      return;
    }
    await reload();
    setBusy(false);
    setText('');
    go(`/a/${data.article.id}`);
  };

  if (busy) {
    return (
      <div className="compose">
        <motion.div className="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="loading__arch" />
          <AnimatePresence mode="wait">
            <motion.p key={phase} className="loading__phase" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.6 }}>
              {phases[phase]}
            </motion.p>
          </AnimatePresence>
          <span className="mono muted">כתבה לוקחת כדקה</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="compose">
      <div className="compose__grid">
      <header className="compose__head">
        <span className="mono kicker">{root ? `חקירה מתמשכת · חלק ${series.length + 1}` : 'עורך מגזין'}</span>
        <h1 className="page-head__title">{root ? root.title : 'ממחשבה לכתבה'}</h1>
        <p className="page-head__lead">
          {root
            ? 'מה עורר בך החלק הקודם? כתבי את התהייה, והכתבה הבאה תמשיך ממנה ותסביר את הגשר בין החלקים.'
            : 'כאן נולדות הכתבות של "המהות". כותבים מחשבה גולמית, והעורך מזקק אותה לכתבה מצולמת שמתפרסמת במגזין.'}
        </p>
      </header>

        <section className="compose__editor" aria-label="כתיבה">
          <>
              {!root && (
                <div className="seeds">
                  <span className="mono">נקודות פתיחה</span>
                  <div className="seeds__list">
                    {SEEDS.map(([label, seed]) => (
                      <button key={label} type="button" className="seed" onClick={() => setText(seed)}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <textarea
                className="composer"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={root ? 'התהייה שעלתה בי' : 'המחשבה שלי, כמו שהיא'}
                rows={9}
                aria-label="טקסט לכתבה"
                onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && submit()}
              />
              <div className="compose__actions">
                <button type="button" className="btn btn--key" onClick={submit} disabled={!text.trim()}>
                  {root ? 'כתיבת ההמשך' : 'זיקוק לכתבה'}
                </button>
                {root && <a className="link-btn" href={`#/a/${root.id}`}>חזרה לכתבה</a>}
                <span className="mono muted">{text.trim() ? `${text.trim().split(/\s+/).length} מילים` : ''}</span>
              </div>
              <p className="key-note"><span className="key-light" aria-hidden="true" /> האור מסמן את הפעולה שמפעילה את מפתחות ה-AI: Claude כותב, fal מצלם.</p>
          </>
        </section>
        <HowItWorks />
      </div>
    </div>
  );
}
