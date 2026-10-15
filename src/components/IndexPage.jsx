import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { formatDate, issueNumbers } from '../data';
import Cover from './Cover';

export default function IndexPage({ articles, status, isAdmin }) {
  const [q, setQ] = useState('');
  const nums = useMemo(() => issueNumbers(articles), [articles]);
  const list = useMemo(() => {
    const t = q.trim();
    if (!t) return articles;
    return articles.filter((a) =>
      [a.title, a.subtitle, a.quote, ...(a.sections || []).map((s) => s.heading + ' ' + s.content)].join(' ').includes(t)
    );
  }, [q, articles]);

  if (status === 'loading') return <div className="state">טוען</div>;

  return (
    <div className="index">
      <header className="page-head">
        <span className="mono kicker">ארכיון</span>
        <h1 className="page-head__title">כל הגיליונות</h1>
        <input
          className="search"
          type="search"
          placeholder="חיפוש בכתבות"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="חיפוש בכתבות"
        />
        <span className="mono muted">{list.length} מתוך {articles.length}</span>
      </header>
      <div className="grid">
        {list.map((a, i) => (
          <motion.a
            key={a.id}
            href={`#/a/${a.id}`}
            className={`tile ${a.published === false ? 'is-draft' : ''}`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, delay: (i % 3) * 0.06 }}
          >
            <div className="tile__media"><Cover article={a} /></div>
            <div className="tile__body">
              <span className="mono">
                גיליון {nums[a.id]}
                {a.root_id ? ` · חלק ${a.part_number}` : ''}
                {isAdmin && a.published === false ? ' · מוסתר' : ''}
              </span>
              <h2 className="tile__title">{a.title}</h2>
              <p className="tile__sub">{a.subtitle}</p>
              <span className="mono muted">{formatDate(a.created_at)}</span>
            </div>
          </motion.a>
        ))}
      </div>
      {!list.length && <div className="state">לא נמצאו כתבות.</div>}
    </div>
  );
}
