import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { formatDate, issueNumbers, readingMinutes, topicCounts } from '../data';
import Cover from './Cover';
import ReadAloud from './ReadAloud';

const ease = [0.2, 0.7, 0.2, 1];
const rise = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.9, delay: 0.08 * i, ease } }),
};

const STEPS = [
  ['השראה', 'תצפית בעיר, שאלה מהעבודה, משפט מספר או רגע מסיור. משהו שעוד לא סודר.'],
  ['קלט', 'העורכת כותבת את המחשבה בעורך המגזין, ממשפט אחד ועד כמה פסקאות.'],
  ['זיקוק וצילום', 'Claude מזקק את המחשבה למבנה של כתבה, ו-fal מצלם עבורה תצלום אדריכלי.'],
  ['פלט', 'כתבה מלאה: נושא, כותרת, ציטוט, פרקים, השפעה לעולם ותצלום. תהייה שהיא מעוררת הופכת לחלק הבא בסדרה.'],
];

export default function Home({ articles, status, onToast }) {
  const coverRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: coverRef, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%']);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.16]);

  if (status === 'loading') return <div className="state">טוען את הגיליון</div>;
  if (status === 'error') return <div className="state">לא הצלחתי לטעון את הכתבות. נסו לרענן.</div>;
  if (!articles.length) return <div className="state">עוד אין כתבות במגזין.</div>;

  const nums = issueNumbers(articles);
  const roots = articles.filter((a) => !a.root_id);
  // The cover always carries the newest article, a follow-up part included.
  const lead = articles[0];
  const topics = topicCounts(articles);
  const series = roots.filter((r) => articles.some((a) => a.root_id === r.id));
  const rest = roots.filter((r) => r.id !== lead.id);
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
          <span /><span />
        </div>

        <header className="cover__top">
          <motion.h1
            className="cover__mast"
            initial={{ opacity: 0, letterSpacing: '0.3em' }}
            animate={{ opacity: 1, letterSpacing: '0.06em' }}
            transition={{ duration: 1.6, ease }}
          >
            המהות
          </motion.h1>
          <span className="mono cover__meta">מגזין הגות · גיליון {nums[lead.id]} · {formatDate(lead.created_at)}</span>
          <p className="cover__tagline">
            מגזין הגות על אדריכלות, עיר, צמצום ורוח. מחשבה גולמית נכנסת, כתבה מצולמת יוצאת.
            <a href="#/new" className="cover__editor">עורך מגזין</a>
          </p>
        </header>

        <motion.div
          className="cover__lead"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.3, ease }}
        >
          <span className="mono kicker">
            הגיליון האחרון{lead.root_id ? ` · חלק ${lead.part_number} בסדרה` : ''}{lead.topic ? ` · ${lead.topic}` : ''}
          </span>
          <a href={`#/a/${lead.id}`} className="cover__title-link">
            <h2 className="cover__title">{lead.title}</h2>
          </a>
          <p className="cover__sub">{lead.subtitle}</p>
          <div className="cover__actions">
            <a href={`#/a/${lead.id}`} className="mono cover__cta">לקריאה · {readingMinutes(lead)} דקות</a>
            <ReadAloud title={lead.title} subtitle={lead.subtitle} onToast={onToast} />
          </div>
        </motion.div>

        {topics.length > 0 && (
          <motion.nav
            className="cover__topics"
            aria-label="נושאי המגזין"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.5, ease }}
          >
            <span className="mono cover__topics-head">הנושאים במגזין</span>
            <ul>
              {topics.map((t) => (
                <li key={t.topic}>
                  <a href={`#/index/${encodeURIComponent(t.topic)}`}>
                    <span className="cover__topic">{t.topic}</span>
                    <span className="mono">{t.count}</span>
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>
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
          <motion.a href="#/new" className="btn btn--line about__cta" variants={rise} custom={4}>עורך מגזין</motion.a>
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

      {/* ---------- Editor's note ---------- */}
      <section className="editorial" aria-labelledby="editorial-title">
        <header className="editorial__head">
          <span className="mono kicker">דבר העורך</span>
          <h2 id="editorial-title" className="editorial__title">שני קולות, כללים גלויים.</h2>
          <p className="editorial__lead">
            "המהות" נכתב בשני קולות: עורך שמזקק, וצלם שמראה. שניהם עובדים לפי כללים גלויים,
            כדי שכל כתבה תשכנע מתוך המהות ולא מתוך קישוט.
          </p>
        </header>
        <div className="editorial__voice">
          <span className="mono">העורך · Claude</span>
          <dl>
            <div><dt>תפיסת עולם</dt><dd>מחשבה טובה היא מחשבה שאפשר לעמוד בתוכה. העורך מחפש את הטענה האחת שבתוך הרעיון, ובונה סביבה כפולת עמודים: כותרת, שלושה או ארבעה פרקים, ציטוט ופעולה.</dd></div>
            <div><dt>מקורות המידע</dt><dd>נקודת המוצא היא הקלט של העורכת. סביבו העורך נשען על ידע מבוסס באדריכלות, תכנון עירוני, פילוסופיה ואמנות. הוא מזכיר רק אנשים, מבנים ויצירות אמיתיים, ולא ממציא ציטוטים או נתונים.</dd></div>
            <div><dt>כללי כתיבה</dt><dd>עברית חיה ותקינה, דימוי מוחשי אחד בכל פרק, בלי קלישאות ובלי סימני קריאה.</dd></div>
            <div><dt>כדי להשפיע</dt><dd>טענה אחת ברורה, הוכחה מוחשית, ופעולה אחת לשבוע הקרוב. שכנוע בלי פעולה נשאר קישוט.</dd></div>
          </dl>
        </div>
        <div className="editorial__voice">
          <span className="mono">הצלם · fal</span>
          <dl>
            <div><dt>תפיסת עולם</dt><dd>הצלם לא מאייר את הטקסט. הוא מצלם מרחב אחד שמגלם את הרעיון, כך שהתמונה תעמוד גם בלי הכתבה.</dd></div>
            <div><dt>מה מאפיין את התמונות</dt><dd>תצלום אדריכלי תיעודי. אור טבעי רך והרבה חלל לבן. חומר אחד בולט, קנה מידה ברור וניגוד אחד. בלי אנשים בפוקוס ובלי טקסט.</dd></div>
            <div><dt>בסיס הפרומפט</dt><dd><code dir="ltr">Documentary realism, professional architecture photography, high-key, airy, soft natural light, generous white space, no text.</code></dd></div>
          </dl>
        </div>
        <p className="editorial__close">המהות לא מנסה להרשים. היא מנסה לשנות מבט: לקרוא כתבה, ולצאת ממנה עם פעולה אחת.</p>
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
            <span className="mono">עוד בגיליון</span>
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
