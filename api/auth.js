import {
  accountPath,
  createId,
  createSession,
  hashPassword,
  normalizeEmail,
  publicUser,
  readBlobJson,
  readJsonBody,
  sendJson,
  verifyPassword,
  writeBlobJson
} from './_blobStore.js';

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getMode(request) {
  return new URL(request.url, 'https://app.local').searchParams.get('mode');
}

async function findAccount(email) {
  return readBlobJson(accountPath(email));
}

async function createAccount(email, password) {
  const now = new Date().toISOString();
  const { salt, hash } = hashPassword(password);
  const account = {
    id: createId('user'),
    email,
    passwordSalt: salt,
    passwordHash: hash,
    createdAt: now,
    updatedAt: now
  };
  await writeBlobJson(accountPath(email), account);
  return account;
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    sendJson(response, 405, { data: null, error: { message: 'Method not allowed' } });
    return;
  }

  try {
    const mode = getMode(request);
    const { email: rawEmail, password } = await readJsonBody(request);
    const email = normalizeEmail(rawEmail);

    if (!isEmail(email)) {
      sendJson(response, 400, { data: null, error: { message: '请填写正确的邮箱地址。' } });
      return;
    }

    if (mode !== 'reset' && String(password || '').length < 6) {
      sendJson(response, 400, { data: null, error: { message: '密码至少需要 6 位。' } });
      return;
    }

    if (mode === 'signup') {
      const existing = await findAccount(email);
      if (existing) {
        sendJson(response, 400, { data: null, error: { message: '这个邮箱已经注册，请切换到登录。' } });
        return;
      }

      const account = await createAccount(email, password);
      sendJson(response, 200, { data: { user: publicUser(account), session: createSession(account) }, error: null });
      return;
    }

    if (mode === 'signin') {
      const account = await findAccount(email);
      if (!account || !verifyPassword(password, account)) {
        sendJson(response, 400, { data: null, error: { message: '邮箱或密码不正确。' } });
        return;
      }

      sendJson(response, 200, { data: { user: publicUser(account), session: createSession(account) }, error: null });
      return;
    }

    if (mode === 'reset') {
      sendJson(response, 200, {
        data: null,
        error: { message: '当前账号系统暂不支持邮件重置密码。请先使用本地模式，或联系我帮你重置。' }
      });
      return;
    }

    sendJson(response, 400, { data: null, error: { message: '未知认证操作。' } });
  } catch (error) {
    console.error('[StellarRPG] Blob auth failed', error);
    sendJson(response, 500, {
      data: null,
      error: { message: '云端账号服务暂时不可用，请稍后重试或先使用本地模式进入。' }
    });
  }
}
