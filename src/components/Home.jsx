import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { formatDate, issueNumbers, readingMinutes } from '../data';
import Cover from './Cover';

const rise = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.9, delay: 0.08 * i, ease: [0.2, 0.7, 0.2, 1] } }),
};

export default function Home({ articles, status }) {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.04, 1.14]);

  if (status === 'loading') return <div className="state">טוען את הגיליון</div>;
  if (status === 'error') return <div className="state">לא הצלחתי לטעון את הכתבות. נסו לרענן.</div>;
  if (!articles.length) return <div className="state">עוד אין כתבות במגזין.</div>;

  const nums = issueNumbers(articles);
  const roots = articles.filter((a) => !a.root_id);
  const lead = roots[0] ?? articles[0];
  const secondary = roots.slice(1, 4);
  const series = roots.filter((r) => articles.some((a) => a.root_id === r.id));
  const rest = roots.slice(4);

  return (
    <div className="home">
      <section className="masthead">
        <motion.div className="masthead__line" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.4 }} />
        <motion.h1 className="masthead__title" initial={{ opacity: 0, letterSpacing: '0.3em' }} animate={{ opacity: 1, letterSpacing: '-0.02em' }} transition={{ duration: 1.6 }}>
          המהות
        </motion.h1>
        <div className="masthead__meta">
          <span className="mono">מגזין לאדריכלות, עיר, צמצום ורוח</span>
          <span className="mono">{articles.length} כתבות</span>
          <span className="mono">{formatDate(lead.created_at)}</span>
        </div>
      </section>

      <a href={`#/a/${lead.id}`} className="lead" ref={heroRef}>
        <div className="lead__media">
          <motion.div className="lead__img" style={{ y: imgY, scale: imgScale }}>
            <Cover article={lead} />
          </motion.div>
          <div className="lead__veil" />
        </div>
        <motion.div className="lead__text" initial="hidden" animate="show">
          <motion.span className="mono kicker" variants={rise} custom={0}>סיפור השער · גיליון {nums[lead.id]}</motion.span>
          <motion.h2 className="lead__title" variants={rise} custom={1}>{lead.title}</motion.h2>
          <motion.p className="lead__sub" variants={rise} custom={2}>{lead.subtitle}</motion.p>
          {lead.quote && (
            <motion.blockquote className="lead__quote" variants={rise} custom={3}>{lead.quote}</motion.blockquote>
          )}
          <motion.span className="mono lead__cta" variants={rise} custom={4}>לקריאה · {readingMinutes(lead)} דקות</motion.span>
        </motion.div>
      </a>

      {secondary.length > 0 && (
        <section className="band">
          <header className="band__head">
            <span className="mono">בגיליון</span>
            <span className="band__rule" />
          </header>
          <div className="trio">
            {secondary.map((a, i) => (
              <motion.a key={a.id} href={`#/a/${a.id}`} className="card" initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} variants={rise} custom={i}>
                <div className="card__media"><Cover article={a} /></div>
                <span className="mono card__num">{nums[a.id]}</span>
                <h3 className="card__title">{a.title}</h3>
                <p className="card__sub">{a.subtitle}</p>
              </motion.a>
            ))}
          </div>
        </section>
      )}

      {series.length > 0 && (
        <section className="band band--dark">
          <header className="band__head">
            <span className="mono">חקירות מתמשכות</span>
            <span className="band__rule" />
          </header>
          <div className="series-list">
            {series.map((r, i) => {
              const parts = [r, ...articles.filter((a) => a.root_id === r.id).sort((a, b) => a.part_number - b.part_number)];
              return (
                <motion.div key={r.id} className="series" initial="hidden" whileInView="show" viewport={{ once: true }} variants={rise} custom={i}>
                  <span className="mono series__count">{parts.length} חלקים</span>
                  <ol className="series__parts">
                    {parts.map((p) => (
                      <li key={p.id}>
                        <a href={`#/a/${p.id}`}>
                          <span className="mono">חלק {p.part_number || 1}</span>
                          <span className="series__title">{p.title}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

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
