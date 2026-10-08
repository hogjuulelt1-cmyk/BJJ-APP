/* Sends one page, never a whole monthly feed document, to the browser.
   Supabase reads use the caller's JWT and existing RLS; no service-role key. */
'use strict';
const config = require('../config.js');
const paging = require('../feed-page.js');

module.exports = async function feed(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }
  const authorization = req.headers.authorization || '';
  if (!/^Bearer \S+$/.test(authorization)) return res.status(401).json({ error: 'Sign in required' });
  const query = new URL(req.url, 'https://arrowbjjapp.vercel.app').searchParams;
  const club = query.get('club') || '';
  let cursor;
  try { cursor = paging.cursor(query.get('cursor')); }
  catch (_) { return res.status(400).json({ error: 'Invalid cursor' }); }
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(club)) return res.status(400).json({ error: 'Invalid club' });
  const headers = { apikey: config.supabaseAnonKey, Authorization: authorization };
  async function read(path) {
    const r = await fetch(config.supabaseUrl + path, { headers, signal: AbortSignal.timeout(10000) });
    if (!r.ok) { const e = new Error('Upstream request failed'); e.status = r.status === 401 || r.status === 403 ? r.status : 502; throw e; }
    return r.json();
  }
  async function doc(path) {
    const rows = await read('/rest/v1/docs?' + new URLSearchParams({ select: 'data', path: 'eq.' + path }));
    return rows[0] && rows[0].data;
  }
  try {
    const [user, members] = await Promise.all([read('/auth/v1/user'), doc('club/' + club + '/members')]);
    const me = ((members || {}).list || []).find(m => m.uid === user.id);
    if (!me || me.socialAllowed !== true) return res.status(403).json({ error: 'Feed unavailable for this member' });
    const prefix = 'club/' + club + '/feed/';
    const month = cursor ? cursor.month : new Date().toISOString().slice(0, 7);
    const asOf = cursor ? cursor.asOf : Date.now();
    // Only month names are listed. At most three monthly docs are read per request.
    const names = await read('/rest/v1/docs?' + new URLSearchParams({ select: 'path', path: 'like.' + prefix + '*', and: '(path.lte.' + prefix + month + ')', order: 'path.desc', limit: '4' }));
    const valid = names.filter(row => /^\d{4}-(0[1-9]|1[0-2])$/.test(row.path.slice(prefix.length)));
    const posts = [];
    let next = null;
    for (let i = 0; i < Math.min(valid.length, 3); i++) {
      const ym = valid[i].path.slice(prefix.length), data = await doc(valid[i].path);
      const result = paging.page((data || {}).list, cursor && ym === cursor.month ? cursor.before : null, asOf, paging.size - posts.length);
      posts.push(...result.posts);
      if (result.more) { next = { month: ym, before: result.before, asOf }; break; }
      if (i + 1 < valid.length) next = { month: valid[i + 1].path.slice(prefix.length), before: null, asOf };
      else next = null;
      if (posts.length >= paging.size) break;
    }
    return res.status(200).json({ posts, next });
  } catch (e) { return res.status(e.status || 502).json({ error: 'Could not fetch the feed' }); }
};
