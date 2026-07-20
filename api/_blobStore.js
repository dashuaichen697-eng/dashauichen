import { get, put } from '@vercel/blob';
import { createHash, createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 90;

function base64Url(input) {
  return Buffer.from(input).toString('base64url');
}

function fromBase64Url(input) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function getSecret() {
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.AUTH_SECRET || 'stellar-rpg-local-secret';
}

export function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

export function readJsonBody(request) {
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

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function createId(prefix) {
  return `${prefix}_${randomBytes(12).toString('hex')}`;
}

export function hashEmail(email) {
  return createHash('sha256').update(normalizeEmail(email)).digest('hex');
}

export function accountPath(email) {
  return `stellar-rpg/accounts/${hashEmail(email)}.json`;
}

export function statePath(userId) {
  return `stellar-rpg/states/${userId}.json`;
}

async function streamToText(stream) {
  if (!stream) return '';
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let output = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    output += decoder.decode(value, { stream: true });
  }

  output += decoder.decode();
  return output;
}

export async function readBlobJson(pathname) {
  const result = await get(pathname, { access: 'private', useCache: false }).catch((error) => {
    if (error?.name === 'BlobNotFoundError') return null;
    throw error;
  });
  if (!result?.stream) return null;
  const text = await streamToText(result.stream);
  return text ? JSON.parse(text) : null;
}

export async function writeBlobJson(pathname, value) {
  await put(pathname, JSON.stringify(value), {
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60
  });
}

export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = pbkdf2Sync(String(password), salt, 120000, 32, 'sha256').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, account) {
  if (!account?.passwordSalt || !account?.passwordHash) return false;
  const { hash } = hashPassword(password, account.passwordSalt);
  const actual = Buffer.from(hash, 'hex');
  const expected = Buffer.from(account.passwordHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function publicUser(account) {
  return {
    id: account.id,
    email: account.email,
    created_at: account.createdAt
  };
}

export function createSession(account) {
  const payload = {
    sub: account.id,
    email: account.email,
    exp: Date.now() + TOKEN_TTL_MS
  };
  const encoded = base64Url(JSON.stringify(payload));
  const signature = createHmac('sha256', getSecret()).update(encoded).digest('base64url');

  return {
    access_token: `${encoded}.${signature}`,
    refresh_token: '',
    token_type: 'bearer',
    expires_in: Math.floor(TOKEN_TTL_MS / 1000),
    expires_at: Math.floor(payload.exp / 1000),
    user: publicUser(account)
  };
}

export function verifySessionToken(token) {
  const [encoded, signature] = String(token || '').split('.');
  if (!encoded || !signature) return null;

  const expected = createHmac('sha256', getSecret()).update(encoded).digest('base64url');
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;

  const payload = JSON.parse(fromBase64Url(encoded));
  if (!payload?.sub || !payload?.email || Date.now() > payload.exp) return null;
  return payload;
}

export function getBearerToken(request) {
  const header = request.headers.authorization || request.headers.Authorization || '';
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? '';
}
