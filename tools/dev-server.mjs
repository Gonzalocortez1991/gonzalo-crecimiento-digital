import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SITE_DIR = join(ROOT, 'site');
const PORT = Number(process.env.PORT || 3000);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.ics': 'text/calendar; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

async function loadRewrites() {
  try {
    const config = JSON.parse(await readFile(join(ROOT, 'vercel.json'), 'utf8'));
    return Array.isArray(config.rewrites) ? config.rewrites : [];
  } catch {
    return [];
  }
}

async function resolveFile(pathname) {
  const clean = decodeURIComponent(pathname.split('?')[0].split('#')[0]);
  const absolute = normalize(join(SITE_DIR, clean));

  if (absolute !== SITE_DIR && !absolute.startsWith(SITE_DIR + sep)) {
    return null;
  }

  try {
    const info = await stat(absolute);
    if (info.isDirectory()) {
      return join(absolute, 'index.html');
    }
    return absolute;
  } catch {
    return null;
  }
}

export async function startServer(port = PORT) {
  const rewrites = await loadRewrites();

  const server = createServer(async (req, res) => {
    const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;

    const rewrite = rewrites.find((rule) => rule.source === pathname);
    const target = rewrite ? rewrite.destination : pathname === '/' ? '/index.html' : pathname;

    let file = await resolveFile(target);

    if (!file) {
      const notFound = await readFile(join(ROOT, 'site', '404.html'), 'utf8').catch(() => null);
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(notFound || '<h1>404</h1><p>Página no encontrada.</p>');
      return;
    }

    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(body);
  });

  return new Promise((resolvePromise) => {
    server.listen(port, '127.0.0.1', () => {
      console.log(`GCD site: http://127.0.0.1:${port}`);
      resolvePromise(server);
    });
  });
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  await startServer();
}
