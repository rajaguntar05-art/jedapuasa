import { vapid } from '../lib/store.mjs';
export default async () => Response.json({ publicKey: (await vapid()).publicKey });
export const config = { path: '/api/push/key' };
