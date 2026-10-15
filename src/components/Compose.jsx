import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { go, seriesOf } from '../data';
import { supabase } from '../supabase';

const PHASES = ['מזקק את המהות המילולית', 'בונה את מבנה הכתבה', 'מצלם את המרחב', 'מעמד את הכפולה'];
const FOLLOW_PHASES = ['קושר קצוות של מחשבה', 'בונה גשר מהחלק הקודם', 'מצלם את המרחב', 'מעמד את הכפולה'];

export default function Compose({ rootId, articles, session, onToast, reload }) {
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

  if (!session.ready) return <div className="state">טוען</div>;
  if (!session.isAdmin) {
    return (
      <div className="state">
        כתיבה פתוחה לעורכת המגזין בלבד. <a href="#/login">כניסה</a>
      </div>
    );
  }

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

  return (
    <div className="compose">
      <AnimatePresence mode="wait">
        {busy ? (
          <motion.div key="loading" className="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="loading__arch" />
            <AnimatePresence mode="wait">
              <motion.p key={phase} className="loading__phase" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.6 }}>
                {phases[phase]}
              </motion.p>
            </AnimatePresence>
            <span className="mono muted">כתבה לוקחת כדקה</span>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <header className="page-head">
              <span className="mono kicker">{root ? `חקירה מתמשכת · חלק ${series.length + 1}` : 'כתבה חדשה'}</span>
              <h1 className="page-head__title">{root ? root.title : 'מחשבה גולמית'}</h1>
              <p className="page-head__lead">
                {root
                  ? 'מה עורר בך החלק הקודם? כתבי את התהייה, והכתבה הבאה תמשיך ממנה.'
                  : 'כתבי רעיון, תצפית או שאלה, בלי לסדר. המגזין יזקק אותם לכתבה עם צילום.'}
              </p>
            </header>
            <textarea
              className="composer"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={root ? 'התהייה שעלתה בי' : 'המחשבה שלי'}
              rows={8}
              aria-label="טקסט לכתבה"
              onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && submit()}
            />
            <div className="compose__actions">
              <button type="button" className="btn" onClick={submit} disabled={!text.trim()}>
                {root ? 'כתיבת ההמשך' : 'זיקוק לכתבה'}
              </button>
              {root && (
                <a className="link-btn" href={`#/a/${root.id}`}>חזרה לכתבה</a>
              )}
              <span className="mono muted">{text.trim() ? `${text.trim().split(/\s+/).length} מילים` : ''}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
