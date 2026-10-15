import { useCallback, useEffect, useState } from 'react';
import { supabase, TABLE } from './supabase';

// Routes live in the hash so "copy link" always carries the current view.
export function parseHash() {
  const h = decodeURIComponent(window.location.hash.replace(/^#\/?/, ''));
  const [page, id] = h.split('/');
  if (page === 'a' && id) return { page: 'article', id };
  if (page === 'new') return { page: 'compose', rootId: id || null };
  if (page === 'index') return { page: 'index', topic: id || null };
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

export const TOPICS = ['אדריכלות ועיר', 'צמצום', 'רוח ומסורת', 'בינה ומכונה', 'מדע ותודעה', 'אמנות ומוזיקה'];

export function topicCounts(articles) {
  return TOPICS.map((t) => ({ topic: t, count: articles.filter((a) => a.topic === t).length })).filter((t) => t.count);
}

export const formatDate = (d) =>
  new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });

export const readingMinutes = (a) => {
  const words = (a.sections || []).reduce((n, s) => n + String(s.content || '').split(/\s+/).length, 0);
  return Math.max(1, Math.round(words / 180));
};
