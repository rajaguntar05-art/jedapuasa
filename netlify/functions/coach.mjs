import { store } from '../lib/store.mjs';
import { ask } from '../lib/coach-core.mjs';
async function takeQuota(limit) {
  const s = store(), day = new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10), key = 'coach/' + day;
  const n = Number(await s.get(key)) || 0;
  if (n >= limit) return false;
  await s.set(key, String(n + 1));
  return true;
}
export default async req => {
  if (req.method !== 'POST') return new Response('Metode tidak didukung', { status: 405 });
  let body; try { body = await req.json() } catch { return Response.json({ error: 'JSON tidak valid' }, { status: 400 }) }
  try {
    const r = await ask({ body, env: process.env, takeQuota });
    return Response.json(r.body, { status: r.status });
  } catch (e) { console.error(e); return Response.json({ error: 'upstream' }, { status: 502 }) }
};
export const config = { path: '/api/coach' };
