import { useEffect, useState } from 'react';
import { supabase, SUPABASE_URL } from '../supabase';

// Signs in from whatever the editor pastes: the link in the email, the address of the
// page it opened (Supabase may send it to localhost while this site is not on its
// redirect list), or a numeric code.
async function signInFromPaste(raw, email) {
  const text = raw.trim();
  if (/^\d{6,10}$/.test(text)) {
    return supabase.auth.verifyOtp({ email, token: text, type: 'email' });
  }
  let url;
  try {
    url = new URL(text);
  } catch {
    return { error: { message: 'זה לא נראה כמו קישור או קוד. העתיקי את הקישור כולו.' } };
  }
  const hash = new URLSearchParams(url.hash.replace(/^#\/?/, '').replace(/^[^?]*\?/, ''));
  const access_token = hash.get('access_token') || url.searchParams.get('access_token');
  const refresh_token = hash.get('refresh_token') || url.searchParams.get('refresh_token');
  if (access_token && refresh_token) return supabase.auth.setSession({ access_token, refresh_token });

  const errorDesc = hash.get('error_description') || url.searchParams.get('error_description');
  if (errorDesc) return { error: { message: 'הקישור פג או כבר נוצל. שלחי קישור חדש.' } };

  const tokenHash = url.searchParams.get('token_hash') || url.searchParams.get('token');
  if (tokenHash) {
    const type = url.searchParams.get('type') || 'magiclink';
    return supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  }
  const code = url.searchParams.get('code');
  if (code) return supabase.auth.exchangeCodeForSession(code);
  return { error: { message: 'לא מצאתי בקישור פרטי כניסה. העתיקי את הקישור מהמייל עצמו.' } };
}

export default function Login({ session }) {
  const [google, setGoogle] = useState(null);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [paste, setPaste] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: 'sb_publishable_IkreG7naPa1h-d4kGp1gpA_sLU4tg5q' } })
      .then((r) => r.json())
      .then((s) => setGoogle(!!s?.external?.google))
      .catch(() => setGoogle(false));
  }, []);

  const redirectTo = window.location.origin + '/';

  const withGoogle = () => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });

  const send = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
    });
    setBusy(false);
    if (err) setError(err.message);
    else setSent(true);
  };

  const finish = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error: err } = await signInFromPaste(paste, email.trim());
    setBusy(false);
    if (err) setError(err.message || 'הכניסה נכשלה. שלחי קישור חדש.');
    else window.location.hash = '/';
  };

  if (session.user) {
    return (
      <div className="login">
        <span className="mono kicker">מחוברת</span>
        <h1 className="page-head__title">{session.user.email}</h1>
        <p className="page-head__lead">
          {session.isAdmin ? 'יש לך הרשאת עריכה. אפשר לכתוב, לערוך ולהסתיר כתבות.' : 'החשבון הזה אינו מוגדר כעורכת המגזין.'}
        </p>
        <a className="btn" href={session.isAdmin ? '#/new' : '#/'}>{session.isAdmin ? 'לכתבה חדשה' : 'לשער'}</a>
      </div>
    );
  }

  return (
    <div className="login">
      <span className="mono kicker">כניסה לעורכת</span>
      <h1 className="page-head__title">המהות</h1>
      <p className="page-head__lead">הקריאה פתוחה לכולם. הכניסה נדרשת רק לכתיבה ולעריכה.</p>

      {google === true && (
        <button type="button" className="btn btn--wide" onClick={withGoogle}>כניסה עם Google</button>
      )}

      {!sent ? (
        <form className="login__form" onSubmit={send}>
          <label className="mono" htmlFor="email">אימייל</label>
          <input id="email" type="email" required dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          <button type="submit" className="btn btn--wide" disabled={busy}>שליחת קישור כניסה</button>
        </form>
      ) : (
        <form className="login__form" onSubmit={finish}>
          <p className="notice">
            נשלח מייל אל {email}. העתיקי את הקישור שבמייל (לחיצה ימנית, "העתקת כתובת הקישור") והדביקי כאן.
            אם כבר לחצת והגעת לדף שגיאה, העתיקי את הכתובת משורת הדפדפן של אותו דף.
          </p>
          <label className="mono" htmlFor="paste">הקישור מהמייל</label>
          <input id="paste" dir="ltr" required value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="https://..." autoComplete="off" />
          <button type="submit" className="btn btn--wide" disabled={busy || !paste.trim()}>כניסה</button>
          <button type="button" className="link-btn" onClick={() => { setSent(false); setPaste(''); }}>שליחה מחדש</button>
        </form>
      )}
      {error && <p className="notice notice--error">{error}</p>}
    </div>
  );
}
