import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const DEV_CHAT = 'https://claude.ai/code/session_013fgYHhbtzo4AWySFtZDKu8';

// Everything technical about the app, shown in the owner's settings panel.
const TECH = [
  ['תוכנת מקור', 'Lovable · הפרויקט Essence Weaver. משם הועברו הקוד והכתבות'],
  ['בנייה', 'Claude Code · Vite, React, framer-motion'],
  ['קוד', 'GitHub · Anat1969/Magazin-GH, ענף main'],
  ['פריסה', 'Vercel · הפרויקט magazin-gh, הכתובת magazin-gh.vercel.app'],
  ['נתונים', 'Supabase · הפרויקט cultura-GH (ktqmwpbzcnzkhjskqisy), טבלה mahut_articles'],
  ['תמונות', 'Supabase Storage · הדלי mahut-media'],
  ['מנוע יצירה', 'Edge Function · mahut-generate, עד 20 כתבות בשעה'],
  ['כותב הכתבות', 'Claude של Anthropic · המפתח ANTHROPIC_API_KEY'],
  ['צלם', 'fal.ai · nano-banana-2, ובגיבוי flux schnell · המפתח FAL_API_KEY'],
  ['תיקיות', 'src/components · supabase/functions/mahut-generate · public'],
  ['גופנים', 'Frank Ruhl Libre · IBM Plex Sans Hebrew · IBM Plex Mono'],
  ['הקראה', 'Web Speech API של הדפדפן, קול עברי אם קיים'],
  ['גישה', 'פתוחה לכולם, בלי כניסה. אין מחיקה, רק הסתרה'],
];

function OwnerMark({ large = false }) {
  return (
    <span className={`owner-mark ${large ? 'owner-mark--large' : ''}`}>
      <img src="/anat-logo.png" alt="" />
      <span className="owner-mark__text">
        <strong>ענת שטיבלמן</strong>
        <span>אדריכלית</span>
      </span>
    </span>
  );
}

export default function TopBar({ route, onToast }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => wrapRef.current && !wrapRef.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => setOpen(false), [route]);

  const copyLink = async () => {
    setOpen(false);
    try {
      await navigator.clipboard.writeText(window.location.href);
      onToast('הקישור הועתק');
    } catch {
      onToast('לא הצלחתי להעתיק. הכתובת בשורת הדפדפן.');
    }
  };

  const active = (p) => (route.page === p ? 'is-active' : '');

  return (
    <header className={`topbar ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="topbar__inner">
        <a href="#/" className="brand" aria-label="המהות, לדף הבית">
          <img src="/icon.svg" alt="" className="brand__mark" />
          <span className="brand__name">המהות</span>
        </a>
        <nav className="topbar__nav" aria-label="ניווט ראשי">
          <a href="#/" className={active('home')}>שער</a>
          <a href="#/index" className={active('index')}>גיליונות</a>
          <a href="#/new" className={active('compose')}>עורך מגזין</a>
        </nav>

        <div className="owner" ref={wrapRef}>
          <button
            type="button"
            className={`owner__btn ${open ? 'is-open' : ''}`}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label="הגדרות ומידע טכני"
            onClick={() => setOpen((o) => !o)}
          >
            <OwnerMark />
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                className="menu"
                role="dialog"
                aria-label="הגדרות ומידע טכני"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <div className="menu__head">
                  <OwnerMark large />
                  <span className="mono muted">המהות · מגזין פתוח</span>
                </div>
                <div className="menu__actions">
                  <a href="#/new" className="menu__item">כתבה חדשה</a>
                  <button type="button" className="menu__item" onClick={copyLink}>העתקת קישור</button>
                  <a className="menu__item" href={DEV_CHAT} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>שיחת הפיתוח</a>
                </div>
                <div className="menu__tech">
                  <span className="mono">כרטיס טכני</span>
                  <dl>
                    {TECH.map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
