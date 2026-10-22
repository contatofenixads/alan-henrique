import { get, put } from '@vercel/blob';
import { CONFIG_PATH, hasBlob, isAuthorized, send } from './_lib.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (!hasBlob()) return send(res, 200, { config: null, storage: false });
    try {
      const r = await get(CONFIG_PATH, { access: 'public', useCache: false });
      if (!r || r.statusCode !== 200) return send(res, 200, { config: null, storage: true });
      const config = await new Response(r.stream).json();
      return send(res, 200, { config, storage: true });
    } catch (err) {
      console.error('config:get', err);
      return send(res, 200, { config: null, storage: true, error: 'Falha ao ler a configuração.' });
    }
  }

  if (req.method === 'POST') {
    if (!isAuthorized(req)) return send(res, 401, { error: 'Não autorizado.' });
    if (!hasBlob()) return send(res, 501, { error: 'Conecte um Vercel Blob ao projeto para publicar alterações.' });
    const config = req.body?.config;
    if (!config || typeof config !== 'object') return send(res, 400, { error: 'Configuração inválida.' });
    try {
      await put(CONFIG_PATH, JSON.stringify(config), {
        access: 'public', addRandomSuffix: false, allowOverwrite: true,
        contentType: 'application/json', cacheControlMaxAge: 60,
      });
      return send(res, 200, { ok: true });
    } catch (err) {
      console.error('config:put', err);
      return send(res, 500, { error: 'Falha ao salvar: ' + err.message });
    }
  }

  return send(res, 405, { error: 'Método não permitido.' });
}
