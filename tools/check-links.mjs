import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SITE_DIR = join(ROOT, 'site');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (extname(entry.name).toLowerCase() === '.html') {
      files.push(full);
    }
  }

  return files;
}

function isExternal(value) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value) || value.trim() === '';
}

function toLocalPath(value) {
  const clean = value.split('#')[0].split('?')[0];
  try {
    return decodeURIComponent(clean);
  } catch {
    return clean;
  }
}

function normalizeUrl(value) {
  const stack = [];
  for (const part of value.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return `/${stack.join('/')}`;
}

async function existsAsFile(path) {
  try {
    const info = await stat(path);
    return info.isFile();
  } catch {
    return false;
  }
}

async function resolveTarget(pageFile, rawValue) {
  const value = toLocalPath(rawValue);
  if (value.startsWith('/')) {
    const target = normalize(join(SITE_DIR, value));
    if (target !== SITE_DIR && !target.startsWith(SITE_DIR + sep)) return null;
    return target;
  }

  const target = normalize(join(pageFile, '..', value));
  if (target !== SITE_DIR && !target.startsWith(SITE_DIR + sep)) return null;
  return target;
}

const config = JSON.parse(await readFile(join(ROOT, 'vercel.json'), 'utf8'));
const rewrites = new Map(
  (config.rewrites || []).map((rule) => [rule.source, rule.destination])
);

const pages = await walk(SITE_DIR);
const missing = [];

for (const page of pages) {
  const html = await readFile(page, 'utf8');
  const attributes = [...html.matchAll(/(?:href|src|action)=["']([^"']+)["']/gi)];

  for (const match of attributes) {
    const value = match[1].trim();
    if (isExternal(value)) continue;

    const target = await resolveTarget(page, value);
    if (!target) continue;

    const candidates = [target, join(target, 'index.html'), `${target}.html`];
    let found = false;

    for (const candidate of candidates) {
      if (await existsAsFile(candidate)) {
        found = true;
        break;
      }
    }

    const localValue = toLocalPath(value);
    const pageRelative = relative(SITE_DIR, page).split(sep).join('/');
    const pageDir = pageRelative.includes('/') ? pageRelative.slice(0, pageRelative.lastIndexOf('/') + 1) : '';
    const urlPath = normalizeUrl(localValue.startsWith('/') ? localValue : `/${pageDir}${localValue}`);

    if (!found) {
      const rewriteDestination = rewrites.get(urlPath);
      if (rewriteDestination) {
        const rewriteTarget = normalize(join(SITE_DIR, rewriteDestination));
        for (const candidate of [rewriteTarget, join(rewriteTarget, 'index.html'), `${rewriteTarget}.html`]) {
          if (await existsAsFile(candidate)) {
            found = true;
            break;
          }
        }
      }
    }

    if (!found && !localValue.startsWith('/')) {
      const rootTarget = normalize(join(SITE_DIR, localValue));
      for (const candidate of [rootTarget, join(rootTarget, 'index.html'), `${rootTarget}.html`]) {
        if (await existsAsFile(candidate)) {
          found = true;
          break;
        }
      }
    }

    if (!found) {
      missing.push({
        page: page.replace(ROOT + sep, ''),
        value
      });
    }
  }
}

if (missing.length === 0) {
  console.log(`OK: ${pages.length} páginas HTML sin enlaces locales roto.`);
  process.exit(0);
}

console.error(`Se encontraron ${missing.length} enlaces locales rotos:\n`);
for (const item of missing) {
  console.error(`- ${item.page} -> ${item.value}`);
}
process.exit(1);
