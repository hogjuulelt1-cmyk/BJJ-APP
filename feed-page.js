/* Shared page ordering for local mode and the authenticated Vercel endpoint. */
(function (root) {
  'use strict';
  const size = 12;
  const key = p => [String(p.d || ''), Number(p.t) || 0, String(p.id || '')];
  function compareKeys(a, b) { return a[0].localeCompare(b[0]) || a[1] - b[1] || a[2].localeCompare(b[2]); }
  function compare(a, b) { return -compareKeys(key(a), key(b)); }
  function page(list, before, asOf, limit) {
    const rows = (list || []).filter(p => p && p.id && (!p.t || p.t <= asOf) && (!before || compareKeys(key(p), before) < 0)).sort(compare);
    const posts = rows.slice(0, limit);
    return { posts, before: posts.length ? key(posts[posts.length - 1]) : before, more: rows.length > limit };
  }
  function cursor(value) {
    if (!value) return null;
    const c = typeof value === 'string' ? JSON.parse(value) : value;
    if (!c || !/^\d{4}-(0[1-9]|1[0-2])$/.test(c.month) || !Number.isFinite(c.asOf) || c.asOf < 0 || c.asOf > Date.now() + 60000) throw new Error('Invalid cursor');
    if (c.before && (!Array.isArray(c.before) || c.before.length !== 3 || typeof c.before[0] !== 'string' || !Number.isFinite(c.before[1]) || typeof c.before[2] !== 'string' || c.before[2].length > 160)) throw new Error('Invalid cursor');
    return c;
  }
  const api = { size, key, compare, page, cursor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ARROW_FEED = api;
})(typeof window === 'undefined' ? globalThis : window);
