import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { formatDate, issueNumbers, readingMinutes } from '../data';
import Cover from './Cover';

const ease = [0.2, 0.7, 0.2, 1];
const rise = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.9, delay: 0.08 * i, ease } }),
};

const STEPS = [
  ['מחשבה גולמית', 'רעיון, תצפית או שאלה, כפי שהם עולים. בלי סדר ובלי עריכה.'],
  ['זיקוק', 'המחשבה מסודרת לכתבה: כותרת, שלושה או ארבעה פרקים, ציטוט ופעולה אחת לעולם.'],
  ['צילום ופריסה', 'לכל כתבה נוצר תצלום אדריכלי משלה, והכול נפרש ככפולת עמודים.'],
  ['העמקה', 'תהייה שעולה מכתבה הופכת לחלק הבא בסדרה, עם גשר שמסביר את המעבר.'],
];

export default function Home({ articles, status }) {
  const coverRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: coverRef, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%']);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.16]);
  const mastY = useTransform(scrollYProgress, [0, 1], ['0%', '-40%']);

  if (status === 'loading') return <div className="state">טוען את הגיליון</div>;
  if (status === 'error') return <div className="state">לא הצלחתי לטעון את הכתבות. נסו לרענן.</div>;
  if (!articles.length) return <div className="state">עוד אין כתבות במגזין.</div>;

  const nums = issueNumbers(articles);
  const roots = articles.filter((a) => !a.root_id);
  const lead = roots[0] ?? articles[0];
  const coverLines = roots.slice(1, 4);
  const series = roots.filter((r) => articles.some((a) => a.root_id === r.id));
  const rest = roots.slice(4);
  const first = articles[articles.length - 1];

  return (
    <div className="home">
      {/* ---------- Cover ---------- */}
      <section className="cover" ref={coverRef} aria-label="שער הגיליון">
        <motion.div className="cover__img" style={{ y: imgY, scale: imgScale }}>
          <Cover article={lead} eager />
        </motion.div>
        <div className="cover__veil" />
        <div className="cover__grid" aria-hidden="true">
          <span /><span /><span /><span />
        </div>

        <div className="cover__strip glass">
          <span className="mono">מגזין הגות · אדריכלות, עיר, צמצום ורוח</span>
          <span className="mono">גיליון {nums[lead.id]} · {formatDate(lead.created_at)}</span>
        </div>

        <motion.h1
          className="cover__mast"
          style={{ y: mastY }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease }}
        >
          המהות
        </motion.h1>

        <motion.a
          href={`#/a/${lead.id}`}
          className="cover__lead glass glass--strong"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.35, ease }}
        >
          <span className="mono kicker">סיפור השער</span>
          <h2 className="cover__title">{lead.title}</h2>
          <p className="cover__sub">{lead.subtitle}</p>
          <span className="mono cover__cta">לקריאה · {readingMinutes(lead)} דקות</span>
        </motion.a>

        {coverLines.length > 0 && (
          <motion.ol
            className="cover__lines glass"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.55, ease }}
          >
            <li className="mono cover__lines-head">בגיליון</li>
            {coverLines.map((a) => (
              <li key={a.id}>
                <a href={`#/a/${a.id}`}>
                  <span className="mono">{nums[a.id]}</span>
                  <span className="cover__line-title">{a.title}</span>
                </a>
              </li>
            ))}
          </motion.ol>
        )}
      </section>

      {/* ---------- About ---------- */}
      <section className="about">
        <motion.div className="about__text" initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
          <motion.span className="mono kicker" variants={rise} custom={0}>על המגזין</motion.span>
          <motion.h2 className="about__title" variants={rise} custom={1}>
            מגזין הגות שנכתב ממחשבות גולמיות.
          </motion.h2>
          <motion.p className="about__lead" variants={rise} custom={2}>
            "המהות" הוא מגזין עברי על אדריכלות, עיר, צמצום ורוח. כל כתבה מתחילה כמחשבה קצרה של
            אד' ענת שטיבלמן, ועוברת זיקוק בעזרת בינה מלאכותית לכפולת עמודים שלמה. המטרה היא לא
            לייצר עוד תוכן, אלא לתת למחשבה צורה שאפשר לחזור אליה, להמשיך ממנה ולשתף.
          </motion.p>
          <motion.dl className="about__facts" variants={rise} custom={3}>
            <div><dt className="mono">כתבות</dt><dd>{articles.length}</dd></div>
            <div><dt className="mono">סדרות</dt><dd>{series.length}</dd></div>
            <div><dt className="mono">מאז</dt><dd>{new Date(first.created_at).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}</dd></div>
          </motion.dl>
        </motion.div>

        <ol className="steps">
          {STEPS.map(([title, text], i) => (
            <motion.li
              key={title}
              className="step"
              initial={{ opacity: 0, y: 40, rotateX: 8 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.9, delay: i * 0.1, ease }}
            >
              <span className="step__num">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="step__title">{title}</h3>
                <p className="step__text">{text}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* ---------- Series ---------- */}
      {series.length > 0 && (
        <section className="band band--dark">
          <header className="band__head">
            <span className="mono">חקירות מתמשכות</span>
            <span className="band__rule" />
          </header>
          <p className="band__intro">
            סדרה נולדת כשכתבה מעוררת תהייה. כל חלק ממשיך את הקודם, והגשר ביניהם מוסבר כאן.
          </p>
          <div className="series-list">
            {series.map((r, i) => {
              const parts = [r, ...articles.filter((a) => a.root_id === r.id).sort((a, b) => a.part_number - b.part_number)];
              return (
                <motion.article key={r.id} className="series" initial="hidden" whileInView="show" viewport={{ once: true }} variants={rise} custom={i}>
                  <span className="mono series__count">סדרה · {parts.length} חלקים</span>
                  <h3 className="series__name">{r.title}</h3>
                  {r.series_note && <p className="series__note">{r.series_note}</p>}
                  <ol className="series__parts">
                    {parts.map((p) => (
                      <li key={p.id}>
                        {p.bridge && <p className="series__bridge">{p.bridge}</p>}
                        <a href={`#/a/${p.id}`}>
                          <span className="mono">חלק {p.part_number || 1}</span>
                          <span className="series__title">{p.title}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </motion.article>
              );
            })}
          </div>
        </section>
      )}

      {/* ---------- Archive ---------- */}
      {rest.length > 0 && (
        <section className="band">
          <header className="band__head">
            <span className="mono">מהארכיון</span>
            <span className="band__rule" />
            <a href="#/index" className="mono band__more">כל הגיליונות</a>
          </header>
          <ol className="toc">
            {rest.map((a, i) => (
              <motion.li key={a.id} initial="hidden" whileInView="show" viewport={{ once: true }} variants={rise} custom={i % 4}>
                <a href={`#/a/${a.id}`} className="toc__row">
                  <span className="mono toc__num">{nums[a.id]}</span>
                  <span className="toc__title">{a.title}</span>
                  <span className="toc__sub">{a.subtitle}</span>
                  <span className="mono toc__date">{formatDate(a.created_at)}</span>
                </a>
              </motion.li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
