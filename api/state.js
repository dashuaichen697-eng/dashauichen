import {
  getBearerToken,
  readBlobJson,
  readJsonBody,
  sendJson,
  statePath,
  verifySessionToken,
  writeBlobJson
} from './_blobStore.js';

function getUser(request, response) {
  const user = verifySessionToken(getBearerToken(request));
  if (!user) {
    sendJson(response, 401, { data: null, error: { message: '登录已过期，请重新登录。' } });
    return null;
  }
  return user;
}

export default async function handler(request, response) {
  try {
    const user = getUser(request, response);
    if (!user) return;

    if (request.method === 'GET') {
      const record = await readBlobJson(statePath(user.sub));
      sendJson(response, 200, { data: record, error: null });
      return;
    }

    if (request.method === 'POST') {
      const { state, updatedAt } = await readJsonBody(request);
      if (!state || typeof state !== 'object') {
        sendJson(response, 400, { data: null, error: { message: '同步数据格式不正确。' } });
        return;
      }

      const record = {
        state,
        updatedAt: updatedAt || state.updatedAt || new Date().toISOString()
      };
      await writeBlobJson(statePath(user.sub), record);
      sendJson(response, 200, { data: record, error: null });
      return;
    }

    sendJson(response, 405, { data: null, error: { message: 'Method not allowed' } });
  } catch (error) {
    console.error('[StellarRPG] Blob state failed', error);
    sendJson(response, 500, { data: null, error: { message: '云端同步失败，请稍后重试。' } });
  }
}
