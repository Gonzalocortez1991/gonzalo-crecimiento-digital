import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const OUT_DIR = join(ROOT, 'docs', 'screenshots');
const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const shots = [
  { name: '01-home-desktop', path: '/', width: 1440, height: 900 },
  { name: '02-pack-starter', path: '/LANDING-PACK-STARTER.html', width: 1440, height: 900 },
  { name: '03-alaya', path: '/alaya', width: 1440, height: 900 },
  { name: '04-home-mobile', path: '/', width: 390, height: 844 }
];

await mkdir(OUT_DIR, { recursive: true });

const server = spawn(process.execPath, [join(ROOT, 'tools', 'dev-server.mjs')], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'inherit']
});

await new Promise((resolvePromise, reject) => {
  const timer = setTimeout(() => reject(new Error('El servidor local no inició a tiempo.')), 10000);
  server.stdout.on('data', (chunk) => {
    if (chunk.toString().includes('GCD site:')) {
      clearTimeout(timer);
      resolvePromise();
    }
  });
  server.on('error', reject);
});

const browser = await chromium.launch();

try {
  for (const shot of shots) {
    const page = await browser.newPage({
      viewport: { width: shot.width, height: shot.height },
      deviceScaleFactor: 1
    });
    await page.goto(`${BASE_URL}${shot.path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(OUT_DIR, `${shot.name}.png`) });
    await page.close();
    console.log(`Capturada: ${shot.name}.png`);
  }
} finally {
  await browser.close();
  server.kill();
}
