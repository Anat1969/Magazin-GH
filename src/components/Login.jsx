import { useEffect, useState } from 'react';
import { supabase, SUPABASE_URL } from '../supabase';

export default function Login({ session }) {
  const [google, setGoogle] = useState(null);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: 'sb_publishable_IkreG7naPa1h-d4kGp1gpA_sLU4tg5q' } })
      .then((r) => r.json())
      .then((s) => setGoogle(!!s?.external?.google))
      .catch(() => setGoogle(false));
  }, []);

  const redirectTo = window.location.origin + '/';

  const withGoogle = () => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });

  const withEmail = async (e) => {
    e.preventDefault();
    setError('');
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
    });
    if (err) setError(err.message);
    else setSent(true);
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
      {google === false && (
        <p className="notice">הכניסה עם Google עוד לא הופעלה בשרת. בינתיים נכנסים עם קישור שנשלח לאימייל.</p>
      )}

      {sent ? (
        <p className="notice">נשלח קישור כניסה אל {email}. פתחי אותו מהמכשיר הזה.</p>
      ) : (
        <form className="login__form" onSubmit={withEmail}>
          <label className="mono" htmlFor="email">אימייל</label>
          <input id="email" type="email" required dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          <button type="submit" className="btn btn--wide">שליחת קישור כניסה</button>
          {error && <p className="notice notice--error">{error}</p>}
        </form>
      )}
    </div>
  );
}
