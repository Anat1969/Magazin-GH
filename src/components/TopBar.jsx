import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const DEV_CHAT = 'https://claude.ai/code/session_013fgYHhbtzo4AWySFtZDKu8';

// Everything technical about the app, shown in the tech card (opened from the A&I logo button).
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

export default function TopBar({ route }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const menuRef = useRef(null);

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

  // The A&I logo button holds copy link, dev chat, install, a new article and the tech card.
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    el.items = [
      { label: 'כתבה חדשה', onSelect: () => { window.location.hash = '#/new'; } },
      { label: 'כרטיס טכני', pressed: open, onSelect: () => setOpen((o) => !o) },
    ];
  }, [open]);

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
          <ai-menu ref={menuRef} chat={DEV_CHAT} />
          <AnimatePresence>
            {open && (
              <motion.div
                className="menu"
                role="dialog"
                aria-label="כרטיס טכני"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
              >
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
