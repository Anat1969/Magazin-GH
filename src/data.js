import { useCallback, useEffect, useState } from 'react';
import { supabase, TABLE } from './supabase';

// Routes live in the hash so "copy link" always carries the current view.
export function parseHash() {
  const h = decodeURIComponent(window.location.hash.replace(/^#\/?/, ''));
  const [page, id] = h.split('/');
  if (page === 'a' && id) return { page: 'article', id };
  if (page === 'new') return { page: 'compose', rootId: id || null };
  if (page === 'index') return { page: 'index' };
  if (page === 'login') return { page: 'login' };
  return { page: 'home' };
}

export function useRoute() {
  const [route, setRoute] = useState(parseHash);
  useEffect(() => {
    const on = () => {
      setRoute(parseHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const go = (path) => {
  window.location.hash = path;
};

export function useSession() {
  const [state, setState] = useState({ user: null, isAdmin: false, ready: false });
  useEffect(() => {
    let alive = true;
    const resolve = async (session) => {
      const user = session?.user ?? null;
      let isAdmin = false;
      if (user?.email) {
        const { data } = await supabase.from('mahut_admins').select('email').ilike('email', user.email).maybeSingle();
        isAdmin = !!data;
      }
      if (alive) setState({ user, isAdmin, ready: true });
    };
    supabase.auth.getSession().then(({ data }) => resolve(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => resolve(session));
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return state;
}

export function useArticles() {
  const [articles, setArticles] = useState([]);
  const [status, setStatus] = useState('loading');
  const load = useCallback(async () => {
    const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
    if (error) {
      setStatus('error');
      return;
    }
    setArticles(data ?? []);
    setStatus('ready');
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return { articles, status, reload: load, setArticles };
}

// Issue numbers follow publication order: the first article is issue 01.
export function issueNumbers(articles) {
  const sorted = [...articles].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const map = {};
  sorted.forEach((a, i) => (map[a.id] = String(i + 1).padStart(2, '0')));
  return map;
}

export function seriesOf(article, articles) {
  const root = article.root_id || article.id;
  return articles
    .filter((a) => a.id === root || a.root_id === root)
    .sort((a, b) => (a.part_number || 1) - (b.part_number || 1));
}

export const formatDate = (d) =>
  new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });

export const readingMinutes = (a) => {
  const words = (a.sections || []).reduce((n, s) => n + String(s.content || '').split(/\s+/).length, 0);
  return Math.max(1, Math.round(words / 180));
};
