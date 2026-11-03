// Jadwal pengingat. Aturannya sama dengan events() di aplikasi.
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m };
const fmt = m => { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0') };

export function localMinute(ts, tz) {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(ts));
  return Number(p.find(x => x.type === 'hour').value) * 60 + Number(p.find(x => x.type === 'minute').value);
}

export function dailyEvents(cfg) {
  const s = toMin(cfg.eatStart), eatMin = (24 - cfg.protocol) * 60, e = s + eatMin, r = cfg.rem || {}, out = [];
  const add = (m, title, body) => out.push({ m: ((m % 1440) + 1440) % 1440, title, body });
  if (r.close) add(e - 30, 'Makan terakhir', `Jendela makan tutup 30 menit lagi, pukul ${fmt(e)}.`);
  if (r.start) add(e, 'Mulai puasa', 'Jendela makan sudah tutup. Buka Jeda untuk mulai mencatat.');
  if (r.open) add(s, 'Waktunya buka puasa', 'Mulai dari air dan makanan ringan berprotein.');
  if (r.move && r.moveAt) add(toMin(r.moveAt), 'Waktunya bergerak', 'Sesi singkat sudah cukup untuk hari ini.');
  if (r.water) for (let m = 540; m <= 1260; m += 180) if (((m - s + 1440) % 1440) >= eatMin) add(m, 'Minum air', 'Satu gelas dulu. Tubuh tetap perlu cairan saat puasa.');
  return out;
}

// Pengingat yang jatuh tempo pada rentang (from, to]
export function dueBetween(cfg, from, to) {
  const daily = dailyEvents(cfg), due = [];
  for (let t = (Math.floor(from / 60000) + 1) * 60000; t <= to; t += 60000) {
    const m = localMinute(t, cfg.tz);
    for (const e of daily) if (e.m === m) due.push({ title: e.title, body: e.body });
  }
  if (cfg.fastDoneAt && cfg.fastDoneAt > from && cfg.fastDoneAt <= to) due.push({ title: 'Target puasa tercapai', body: 'Bagus. Buka puasa kalau sudah siap.' });
  return due;
}

const HOSTS = [/^fcm\.googleapis\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/, /(^|\.)push\.services\.mozilla\.com$/];
export function validSub(s) {
  try {
    const u = new URL(s.endpoint);
    return u.protocol === 'https:' && HOSTS.some(h => h.test(u.hostname)) && typeof s.keys?.p256dh === 'string' && typeof s.keys?.auth === 'string';
  } catch { return false }
}
export function validCfg(c) {
  try { new Intl.DateTimeFormat('en', { timeZone: c.tz }) } catch { return false }
  return /^\d\d:\d\d$/.test(c?.eatStart || '') && [12, 14, 16, 18].includes(c?.protocol);
}
