import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';

const DEV_CHAT = 'https://claude.ai/code/session_013fgYHhbtzo4AWySFtZDKu8';

export default function TopBar({ route, session, onToast }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
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

  const signOut = async () => {
    setOpen(false);
    await supabase.auth.signOut();
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
          <a href="#/new" className={`nav-editor ${active('compose')}`}>עורך מגזין</a>
        </nav>

        <div className="owner" ref={wrapRef}>
          <button
            type="button"
            className={`owner__btn ${open ? 'is-open' : ''}`}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="הגדרות"
            onClick={() => setOpen((o) => !o)}
          >
            <img src="/anat-logo.png" alt="" />
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                className="menu"
                role="menu"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <div className="menu__head">
                  <img src="/anat-logo.png" alt="" />
                  <div>
                    <strong>אד' ענת שטיבלמן</strong>
                    <span className="mono muted">{session.user ? session.user.email : 'קריאה בלבד'}</span>
                  </div>
                </div>
                {session.isAdmin && (
                  <a role="menuitem" href="#/new" className="menu__item">כתבה חדשה</a>
                )}
                <button role="menuitem" type="button" className="menu__item" onClick={copyLink}>העתקת קישור</button>
                <a role="menuitem" className="menu__item" href={DEV_CHAT} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>שיחת הפיתוח</a>
                <div className="menu__rule" />
                {session.user ? (
                  <button role="menuitem" type="button" className="menu__item" onClick={signOut}>יציאה</button>
                ) : (
                  <a role="menuitem" href="#/login" className="menu__item">כניסה לעורכת</a>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
