import { store, subKey, vapid, send } from '../lib/store.mjs';
import { validSub, validCfg } from '../lib/reminders.mjs';
export default async req => {
  if (req.method !== 'POST') return new Response('Metode tidak didukung', { status: 405 });
  let b; try { b = await req.json() } catch { return new Response('JSON tidak valid', { status: 400 }) }
  if (!validSub(b.sub || {})) return new Response('Langganan tidak valid', { status: 400 });
  const s = store(), key = subKey(b.sub.endpoint);
  if (b.action === 'remove') { await s.delete(key); return Response.json({ ok: true }) }
  if (!validCfg(b.cfg)) return new Response('Jadwal tidak valid', { status: 400 });
  const old = await s.get(key, { type: 'json' });
  await s.setJSON(key, { sub: b.sub, cfg: b.cfg, last: old?.last || Date.now() });
  if (b.action === 'test') {
    try { await send(b.sub, { title: 'Pengingat Jeda aktif', body: 'Notifikasi ini datang dari server. Anda boleh menutup aplikasi.' }, await vapid(s)) }
    catch (e) { return new Response('Gagal mengirim: ' + (e.statusCode || e.message), { status: 502 }) }
  }
  return Response.json({ ok: true });
};
export const config = { path: '/api/push/sync' };
