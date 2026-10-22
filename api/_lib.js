import crypto from 'node:crypto';

export const CONFIG_PATH = 'site/config.json';

export function tokenFor(password) {
  return crypto.createHash('sha256').update(`rebecca-lab:${password}`).digest('hex');
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function checkPassword(password) {
  const pw = process.env.ADMIN_PASSWORD;
  return !!pw && safeEqual(tokenFor(password ?? ''), tokenFor(pw));
}

export function isAuthorized(req) {
  const pw = process.env.ADMIN_PASSWORD;
  return !!pw && safeEqual(req.headers['x-admin-token'] || '', tokenFor(pw));
}

export const hasBlob = () => !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

export function send(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(body);
}
