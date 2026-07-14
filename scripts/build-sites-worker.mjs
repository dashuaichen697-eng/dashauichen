/* global console, process */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const serverDir = path.join(distDir, 'server');
const serverFile = path.join(serverDir, 'index.js');

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

async function collectFiles(dir, base = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === 'server') {
      continue;
    }

    const relativePath = path.posix.join(base, entry.name);
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath, relativePath));
    } else {
      const buffer = await readFile(fullPath);
      files.push({
        path: `/${relativePath}`,
        contentType: contentTypes[path.extname(entry.name)] || 'application/octet-stream',
        body: buffer.toString('base64'),
      });
    }
  }

  return files;
}

const files = await collectFiles(distDir);
const fileMap = Object.fromEntries(
  files.map((file) => [file.path, { contentType: file.contentType, body: file.body }])
);

const workerSource = `const files = ${JSON.stringify(fileMap)};

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function getAsset(pathname) {
  if (files[pathname]) {
    return files[pathname];
  }

  if (!pathname.includes('.') && files['/index.html']) {
    return files['/index.html'];
  }

  return null;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const asset = getAsset(url.pathname);

    if (!asset) {
      return new Response('Not found', { status: 404 });
    }

    return new Response(decodeBase64(asset.body), {
      headers: {
        'content-type': asset.contentType,
        'cache-control': asset.contentType.includes('text/html')
          ? 'no-cache'
          : 'public, max-age=31536000, immutable',
      },
    });
  },
};
`;

await mkdir(serverDir, { recursive: true });
await writeFile(serverFile, workerSource);
console.log(`Generated ${path.relative(rootDir, serverFile)} with ${files.length} assets.`);
