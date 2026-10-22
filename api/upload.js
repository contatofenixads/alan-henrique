import { put } from '@vercel/blob';
import { hasBlob, isAuthorized, send } from './_lib.js';

const ALLOWED = /^image\/(png|jpe?g|webp|gif|svg\+xml|avif|x-icon|vnd\.microsoft\.icon)$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido.' });
  if (!isAuthorized(req)) return send(res, 401, { error: 'Não autorizado.' });
  if (!hasBlob()) return send(res, 501, { error: 'Armazenamento de imagens não conectado.' });

  const { name = 'imagem', dataUrl = '' } = req.body || {};
  const m = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
  if (!m || !ALLOWED.test(m[1])) return send(res, 400, { error: 'Formato de imagem não suportado.' });

  const ext = { 'image/svg+xml': 'svg', 'image/jpeg': 'jpg', 'image/x-icon': 'ico', 'image/vnd.microsoft.icon': 'ico' }[m[1]] || m[1].split('/')[1];
  const base = String(name).replace(/\.[^.]+$/, '').normalize('NFD').replace(/[^\w-]+/g, '-').slice(0, 40) || 'imagem';
  try {
    const blob = await put(`uploads/${base}.${ext}`, Buffer.from(m[2], 'base64'), {
      access: 'public', addRandomSuffix: true, contentType: m[1],
    });
    return send(res, 200, { url: blob.url });
  } catch (err) {
    console.error('upload', err);
    return send(res, 500, { error: 'Falha no envio: ' + err.message });
  }
}
