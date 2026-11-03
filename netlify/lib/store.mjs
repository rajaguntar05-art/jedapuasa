import { getStore } from '@netlify/blobs';
import webpush from 'web-push';
import { createHash } from 'node:crypto';

export const store = () => getStore({ name: 'jeda-push', consistency: 'strong' });
export const subKey = endpoint => 'sub/' + createHash('sha256').update(endpoint).digest('hex');

// Kunci VAPID dibuat sekali saat pertama dipakai, lalu disimpan privat di Netlify Blobs.
export async function vapid(s = store()) {
  let k = await s.get('vapid', { type: 'json' });
  if (!k) { k = webpush.generateVAPIDKeys(); await s.setJSON('vapid', k) }
  return k;
}
export async function send(sub, payload, keys) {
  const site = process.env.URL || 'https://example.netlify.app';
  return webpush.sendNotification(sub, JSON.stringify(payload), {
    TTL: 1800, urgency: 'high', topic: undefined,
    vapidDetails: { subject: site, publicKey: keys.publicKey, privateKey: keys.privateKey }
  });
}
