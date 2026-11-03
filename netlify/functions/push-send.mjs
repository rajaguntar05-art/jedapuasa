import { store, vapid, send } from '../lib/store.mjs';
import { dueBetween } from '../lib/reminders.mjs';
const MAX_BACK = 15 * 60000;
export default async () => {
  const s = store(), now = Date.now(), keys = await vapid(s), { blobs } = await s.list({ prefix: 'sub/' });
  await Promise.all(blobs.map(async ({ key }) => {
    const rec = await s.get(key, { type: 'json' });
    if (!rec) return;
    const due = dueBetween(rec.cfg, Math.max(rec.last || 0, now - MAX_BACK), now);
    for (const n of due) {
      try { await send(rec.sub, n, keys) }
      catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) { await s.delete(key); return }
        console.error('push gagal', e.statusCode || e.message);
      }
    }
    await s.setJSON(key, { ...rec, last: now });
  }));
};
export const config = { schedule: '*/5 * * * *' };
