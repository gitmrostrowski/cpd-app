import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // ... Twoje dane / HTML ...

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true, // albo chromium.headless ?? true
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 }); // opcjonalnie
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({ format: 'A4', printBackground: true });

  await browser.close();

  // => Response wymaga ArrayBuffer:
  const buf = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
  const arr = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

  return new Response(arr, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="cpd-portfolio.pdf"',
    },
  });
}
