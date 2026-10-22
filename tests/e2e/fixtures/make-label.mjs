// Renders tests/e2e/fixtures/tropika-label.png: a mock pack with a real
// EAN-13 barcode, expiry date and NAFDAC number, used by the photo tests.
// Run: node tests/e2e/fixtures/make-label.mjs
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

/** EAN-13 → string of 95 modules ('1' = bar). */
function ean13(code) {
  const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
  // G-code is the R-code (complement of L) read right to left.
  const G = L.map((p) => [...p].map((b) => (b === '1' ? '0' : '1')).reverse().join(''));
  const R = L.map((p) => [...p].map((b) => (b === '1' ? '0' : '1')).join(''));
  const parity = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
  const d = [...code].map(Number);
  let m = '101';
  for (let i = 1; i <= 6; i++) m += (parity[d[0]][i - 1] === 'L' ? L : G)[d[i]];
  m += '01010';
  for (let i = 7; i <= 12; i++) m += R[d[i]];
  return m + '101';
}

const MODULE = 3;
const modules = ean13('6150000000051');
const width = modules.length * MODULE;
let bars = '';
[...modules].forEach((b, i) => {
  if (b === '1') bars += `<rect x="${i * MODULE}" y="0" width="${MODULE}" height="120"/>`;
});
const matrix = { getWidth: () => width };

const html = `<!doctype html><html><body style="margin:0;background:#e9e4d8;font-family:Arial,Helvetica,sans-serif">
<div style="width:520px;margin:30px auto;background:#f28c28;border-radius:22px;padding:26px;border:4px solid #222">
  <div style="font-size:52px;font-weight:900;color:#fff;letter-spacing:-1px">Tropika</div>
  <div style="font-size:26px;color:#fff;font-weight:700">Orange Juice · 1 L</div>
  <div style="margin-top:22px;background:#fffbea;border-radius:12px;padding:18px;color:#111">
    <div style="font-size:26px;font-weight:700">EXP: 14/03/2027</div>
    <div style="font-size:22px;margin-top:6px">NAFDAC REG. NO: A8-0005</div>
    <div style="font-size:16px;margin-top:6px">Batch: TR2409 · Store in a cool dry place</div>
    <div style="background:#fff;margin-top:16px;padding:14px 60px 6px;text-align:center">
      <svg width="${matrix.getWidth()}" height="120" viewBox="0 0 ${matrix.getWidth()} 120" shape-rendering="crispEdges">${bars}</svg>
      <div style="font-family:monospace;font-size:22px;letter-spacing:6px;text-align:center">6150000000051</div>
    </div>
  </div>
</div></body></html>`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 600, height: 620 } });
await page.setContent(html);
await page.screenshot({ path: fileURLToPath(new URL('./tropika-label.png', import.meta.url)) });

// Fake webcam footage for the live-scan test: Chrome's --use-file-for-fake-video-capture
// accepts an .mjpeg file, which is just JPEG frames back to back.
await page.setViewportSize({ width: 640, height: 480 });
await page.evaluate(() => window.scrollTo(0, 230));
const frame = await page.screenshot({ type: 'jpeg', quality: 90 });
const { writeFileSync } = await import('node:fs');
writeFileSync(fileURLToPath(new URL('./tropika-label.mjpeg', import.meta.url)), Buffer.concat(Array(5).fill(frame)));

await browser.close();
console.log('wrote tropika-label.png and tropika-label.mjpeg');
