// app/report/route.ts
import { Buffer } from 'node:buffer';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // Minimalny HTML do wygenerowania PDF (później podmienisz na swój)
  const html = `<!doctype html>
  <html lang="pl">
    <head>
      <meta charset="utf-8" />
      <title>Raport CPD</title>
      <style>
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; font-size: 12px; color: #111; }
        h1 { font-size: 20px; margin: 0 0 8px; }
        .box { border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin: 12px 0; }
        .muted { color: #555; }
      </style>
    </head>
    <body>
      <h1>Raport CPD</h1>
      <div class="muted">Przykładowy raport PDF wygenerowany na Vercel</div>
      <div class="box">
        <strong>Użytkownik:</strong> — (tu wstawisz dane z Supabase)<br/>
        <strong>Suma punktów:</strong> —<br/>
        <strong>Okres:</strong> —<br/>
      </div>
      <p class="muted">Ten szablon możesz swobodnie rozbudować.</p>
    </body>
  </html>`;

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true, // bezpiecznie na Vercel
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 }); // opcjonalnie
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  // Response potrzebuje ArrayBuffer
  const buf = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf as Uint8Array);
  const arr = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

  return new Response(arr, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="cpd-portfolio.pdf"',
    },
  });
}
