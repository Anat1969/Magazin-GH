import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDate, go, issueNumbers, readingMinutes, seriesOf } from '../data';
import { supabase, TABLE } from '../supabase';
import Cover from './Cover';

function Editable({ as: Tag = 'p', editing, value, onChange, className }) {
  if (!editing) return <Tag className={className}>{value}</Tag>;
  return (
    <Tag
      className={`${className} is-editable`}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onChange(e.currentTarget.innerText.trim())}
    >
      {value}
    </Tag>
  );
}

export default function ArticlePage({ id, articles, status, session, onToast, reload }) {
  const article = articles.find((a) => a.id === id);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress: heroP } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const imgY = useTransform(heroP, [0, 1], ['0%', '22%']);
  const fade = useTransform(heroP, [0, 0.8], [1, 0.2]);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  useEffect(() => {
    setEditing(false);
    setDraft(null);
  }, [id]);

  const nums = useMemo(() => issueNumbers(articles), [articles]);

  if (status === 'loading') return <div className="state">טוען את הכתבה</div>;
  if (!article) return <div className="state">הכתבה לא נמצאה. <a href="#/index">לכל הגיליונות</a></div>;

  const a = editing && draft ? draft : article;
  const series = seriesOf(article, articles);
  const roots = articles.filter((x) => !x.root_id);
  const ri = roots.findIndex((x) => x.id === (article.root_id || article.id));
  const newer = ri > 0 ? roots[ri - 1] : null;
  const older = ri >= 0 && ri < roots.length - 1 ? roots[ri + 1] : null;

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const setSection = (i, patch) =>
    setDraft((d) => ({ ...d, sections: d.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));

  const startEdit = () => {
    setDraft({ ...article, sections: (article.sections || []).map((s) => ({ ...s })) });
    setEditing(true);
  };

  const save = async () => {
    setBusy(true);
    const { error } = await supabase
      .from(TABLE)
      .update({
        title: draft.title,
        subtitle: draft.subtitle,
        quote: draft.quote,
        sections: draft.sections,
        pragmatic_action: draft.pragmatic_action,
        ...(article.root_id ? { bridge: draft.bridge || null } : { series_note: draft.series_note || null }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', article.id);
    setBusy(false);
    if (error) return onToast('השמירה נכשלה: ' + error.message);
    setEditing(false);
    onToast('נשמר');
    reload();
  };

  const togglePublish = async () => {
    setBusy(true);
    const { error } = await supabase.from(TABLE).update({ published: !article.published }).eq('id', article.id);
    setBusy(false);
    if (error) return onToast('הפעולה נכשלה: ' + error.message);
    onToast(article.published ? 'הכתבה הוסתרה מהקוראים' : 'הכתבה פורסמה');
    reload();
  };

  const remove = async () => {
    if (!window.confirm('למחוק את הכתבה לצמיתות?')) return;
    setBusy(true);
    const { error } = await supabase.from(TABLE).delete().eq('id', article.id);
    setBusy(false);
    if (error) return onToast('המחיקה נכשלה: ' + error.message);
    onToast('הכתבה נמחקה');
    await reload();
    go('/index');
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, text: article.subtitle, url });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      onToast('קישור לכתבה הועתק');
    } catch {
      onToast('לא הצלחתי לשתף');
    }
  };

  return (
    <article className="article">
      <motion.div className="progress" style={{ scaleX: progress }} />

      <header className="spread" ref={heroRef}>
        <motion.div className="spread__media" style={{ y: imgY }}>
          <Cover article={article} eager />
        </motion.div>
        <div className="spread__veil" />
        <motion.div className="spread__text" style={{ opacity: fade }}>
          {article.root_id || series.length > 1 ? (
            <span className="mono kicker">חקירה מתמשכת · חלק {article.part_number || 1} מתוך {series.length}</span>
          ) : (
            <span className="mono kicker">גיליון {nums[article.id]}{article.topic ? ` · ${article.topic}` : ''}</span>
          )}
          <Editable as="h1" className="spread__title" editing={editing} value={a.title} onChange={(v) => set({ title: v })} />
          <Editable as="p" className="spread__sub" editing={editing} value={a.subtitle} onChange={(v) => set({ subtitle: v })} />
          <div className="spread__meta mono">
            <span>{formatDate(article.created_at)}</span>
            <span>{readingMinutes(article)} דקות קריאה</span>
            {article.published === false && <span>מוסתרת</span>}
          </div>
        </motion.div>
      </header>

      <div className="body">
        <aside className="aside">
          {(a.quote || editing) && (
            <Editable as="blockquote" className="pull" editing={editing} value={a.quote || ''} onChange={(v) => set({ quote: v })} />
          )}
          {series.length > 1 && (
            <nav className="aside__series" aria-label="חלקי הסדרה">
              <span className="mono">על הסדרה</span>
              {article.root_id
                ? series[0].series_note && <p className="aside__note">{series[0].series_note}</p>
                : (a.series_note || editing) && (
                    <Editable as="p" className="aside__note" editing={editing} value={a.series_note || ''} onChange={(v) => set({ series_note: v })} />
                  )}
              <ol>
                {series.map((p) => (
                  <li key={p.id} className={p.id === article.id ? 'is-current' : ''}>
                    <a href={`#/a/${p.id}`}>
                      <span className="mono">{p.part_number || 1}</span> {p.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <div className="aside__actions">
            <button type="button" className="link-btn" onClick={share}>שיתוף</button>
            <button type="button" className="link-btn" onClick={() => window.print()}>הדפסה או PDF</button>
          </div>
        </aside>

        <div className="text">
          {article.root_id && (a.bridge || editing) && (
            <div className="bridge">
              <span className="mono kicker">מהחלק הקודם</span>
              <Editable as="p" className="bridge__text" editing={editing} value={a.bridge || ''} onChange={(v) => set({ bridge: v })} />
            </div>
          )}
          {(a.sections || []).map((s, i) => (
            <motion.section
              key={i}
              className="chapter"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8 }}
            >
              <div className="chapter__head">
                <span className="mono chapter__num">{String(i + 1).padStart(2, '0')}</span>
                <Editable as="h2" className="chapter__title" editing={editing} value={s.heading} onChange={(v) => setSection(i, { heading: v })} />
              </div>
              <Editable as="p" className={`chapter__body ${i === 0 ? 'has-drop' : ''}`} editing={editing} value={s.content} onChange={(v) => setSection(i, { content: v })} />
            </motion.section>
          ))}

          <motion.section className="impact" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9 }}>
            <span className="mono kicker">השפעה לעולם</span>
            <Editable as="p" className="impact__text" editing={editing} value={a.pragmatic_action} onChange={(v) => set({ pragmatic_action: v })} />
          </motion.section>

          {session.isAdmin && !editing && (
            <div className="deepen">
              <span className="mono">העמקה ותהיות</span>
              <p>מה המאמר עורר? הכתבה הבאה בסדרה תענה על התהייה.</p>
              <button type="button" className="btn" onClick={() => go(`/new/${article.root_id || article.id}`)}>
                כתיבת חלק {series.length + 1}
              </button>
            </div>
          )}

          <nav className="pager" aria-label="כתבות נוספות">
            {newer ? (
              <a href={`#/a/${newer.id}`} className="pager__item">
                <span className="mono">הכתבה הבאה</span>
                <span className="pager__title">{newer.title}</span>
              </a>
            ) : <span />}
            {older ? (
              <a href={`#/a/${older.id}`} className="pager__item pager__item--end">
                <span className="mono">הכתבה הקודמת</span>
                <span className="pager__title">{older.title}</span>
              </a>
            ) : <span />}
          </nav>
        </div>
      </div>

      {session.isAdmin && (
        <div className="editbar" role="toolbar" aria-label="עריכה">
          <span className="mono editbar__label">{editing ? 'מצב עריכה' : 'עורכת'}</span>
          {editing ? (
            <>
              <button type="button" className="btn btn--small" onClick={save} disabled={busy}>שמירה</button>
              <button type="button" className="btn btn--small btn--ghost" onClick={() => setEditing(false)} disabled={busy}>ביטול</button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn--small" onClick={startEdit}>עריכת הכתבה</button>
              <button type="button" className="btn btn--small btn--ghost" onClick={togglePublish} disabled={busy}>
                {article.published === false ? 'פרסום' : 'הסתרה'}
              </button>
              <button type="button" className="btn btn--small btn--danger" onClick={remove} disabled={busy}>מחיקה</button>
            </>
          )}
        </div>
      )}
    </article>
  );
}
