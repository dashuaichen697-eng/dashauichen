const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.on('data', (chunk) => {
      raw += chunk;
    });
    request.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function getErrorMessage(status, body) {
  if (typeof body?.msg === 'string') return body.msg;
  if (typeof body?.message === 'string') return body.message;
  if (typeof body?.error_description === 'string') return body.error_description;
  if (typeof body?.error === 'string') return body.error;

  if (status === 400) return '注册或登录信息不符合要求，请检查邮箱和密码。';
  if (status === 401) return '邮箱或密码不正确。';
  if (status === 422) return '这个邮箱或密码暂时不能使用，请换一个邮箱或更强的密码。';
  if (status >= 500) return '云端同步服务暂时不可用，请稍后重试。';
  return '云端同步连接失败，请稍后重试或先使用本地模式进入。';
}

function normalizeSession(body) {
  if (!body?.access_token) return null;
  return {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    token_type: body.token_type,
    expires_in: body.expires_in,
    expires_at: body.expires_at,
    user: body.user
  };
}

async function callSupabase(path, payload, origin) {
  const url = new URL(path, SUPABASE_URL);
  if (origin) url.searchParams.set('redirect_to', origin);

  const result = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const text = await result.text();
  const body = text ? JSON.parse(text) : {};

  if (!result.ok) {
    return {
      data: null,
      error: {
        message: getErrorMessage(result.status, body),
        status: result.status
      }
    };
  }

  return {
    data: {
      user: body.user ?? null,
      session: normalizeSession(body)
    },
    error: null
  };
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    sendJson(response, 405, { data: null, error: { message: 'Method not allowed' } });
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    sendJson(response, 500, { data: null, error: { message: '云端同步尚未配置' } });
    return;
  }

  try {
    const mode = new URL(request.url, 'https://app.local').searchParams.get('mode');
    const { email, password } = await readBody(request);
    const origin = request.headers.origin;

    if (!email || (mode !== 'reset' && !password)) {
      sendJson(response, 400, { data: null, error: { message: '请填写邮箱和密码' } });
      return;
    }

    if (mode === 'signin') {
      const result = await callSupabase('/auth/v1/token?grant_type=password', { email, password }, null);
      sendJson(response, result.error ? 400 : 200, result);
      return;
    }

    if (mode === 'signup') {
      const result = await callSupabase('/auth/v1/signup', { email, password }, origin);
      sendJson(response, result.error ? 400 : 200, result);
      return;
    }

    if (mode === 'reset') {
      const result = await callSupabase('/auth/v1/recover', { email }, origin);
      sendJson(response, result.error ? 400 : 200, result);
      return;
    }

    sendJson(response, 400, { data: null, error: { message: '未知认证操作' } });
  } catch (error) {
    console.error('[StellarRPG] Auth API failed', error);
    sendJson(response, 500, {
      data: null,
      error: { message: '云端同步连接失败，请稍后重试或先使用本地模式进入。' }
    });
  }
}
