import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

const DEV_CHAT = 'https://claude.ai/code/session_013fgYHhbtzo4AWySFtZDKu8';

export default function TopBar({ route, session, onToast }) {
  const [installEvt, setInstallEvt] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallEvt(e);
    };
    const onInstalled = () => setInstallEvt(null);
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      onToast('הקישור הועתק');
    } catch {
      onToast('לא הצלחתי להעתיק. הכתובת בשורת הדפדפן.');
    }
  };

  const install = async () => {
    if (!installEvt) return;
    installEvt.prompt();
    await installEvt.userChoice.catch(() => null);
    setInstallEvt(null);
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
          {session.isAdmin && (
            <a href="#/new" className={active('compose')}>כתיבה</a>
          )}
        </nav>
        <div className="topbar__tools">
          <button type="button" className="chip" onClick={copyLink}>העתקת קישור</button>
          <a className="chip" href={DEV_CHAT} target="_blank" rel="noreferrer">שיחת הפיתוח</a>
          {installEvt && (
            <button type="button" className="chip chip--accent" onClick={install}>התקנת האפליקציה</button>
          )}
          {session.user ? (
            <button type="button" className="chip chip--ghost" onClick={() => supabase.auth.signOut()}>יציאה</button>
          ) : (
            <a className="chip chip--ghost" href="#/login">כניסה</a>
          )}
        </div>
      </div>
    </header>
  );
}
