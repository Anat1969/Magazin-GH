import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import ArticlePage from './components/ArticlePage';
import Compose from './components/Compose';
import Home from './components/Home';
import IndexPage from './components/IndexPage';
import TopBar from './components/TopBar';
import { useArticles, useRoute } from './data';



export default function App() {
  const route = useRoute();
  const { articles, status, reload } = useArticles();
  const [toast, setToast] = useState('');

  const onToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(onToast.t);
    onToast.t = setTimeout(() => setToast(''), 2600);
  }, []);

  useEffect(() => {
    const a = route.page === 'article' && articles.find((x) => x.id === route.id);
    document.title = a ? `${a.title} · המהות` : 'המהות';
  }, [route, articles]);

  const visible = articles;
  const published = articles.filter((a) => a.published !== false);
  const key = route.page + (route.id || '') + (route.rootId || '') + (route.topic || '');

  let page;
  if (route.page === 'article') page = <ArticlePage id={route.id} articles={visible} status={status} onToast={onToast} reload={reload} />;
  else if (route.page === 'index') page = <IndexPage articles={visible} status={status} isAdmin topic={route.topic} />;
  else if (route.page === 'compose') page = <Compose rootId={route.rootId} articles={visible} onToast={onToast} reload={reload} />;
  else page = <Home articles={published} status={status} onToast={onToast} />;

  return (
    <>
      <TopBar route={route} />
      <AnimatePresence mode="wait">
        <motion.main key={key} className="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
          {page}
        </motion.main>
      </AnimatePresence>
      <footer className="footer">
        <span className="footer__rule" />
        <a href="#/" className="footer__name">המהות</a>
        <span className="mono muted">כתבות שנולדו ממחשבה גולמית</span>
      </footer>
      <AnimatePresence>
        {toast && (
          <motion.div className="toast" role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
