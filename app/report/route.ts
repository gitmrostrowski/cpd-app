// app/report/route.ts
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const html = `<!doctype html><html lang="pl"><head>
    <meta charSet="utf-8" /><title>Raport CPD</title>
    <style>body{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;font-size:12px;color:#111}
      h1{font-size:20px;margin:0 0 8px}.box{border:1px solid #ddd;border-radius:8px;padding:12px;margin:12px 0}
      .muted{color:#555}</style></head>
    <body><h1>Raport CPD</h1>
      <div class="muted">PDF wygenerowany na Vercel (puppeteer-core + chromium)</div>
      <div class="box"><strong>Użytkownik:</strong> —<br/><strong>Suma punktów:</strong> —<br/><strong>Okres:</strong> —<br/></div>
    </body></html>`;

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 }); // opcjonalnie
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // 1) PDF z Puppeteera może być Uint8Array — zamieniamy go pewnie na ArrayBuffer
  const pdfUint8 = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  // 2) Wytnij czysty ArrayBuffer (bez SharedArrayBuffer)
  const uint8 = pdfUint8 instanceof Uint8Array ? pdfUint8 : new Uint8Array(pdfUint8 as ArrayBuffer);
  const arrayBuffer = uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength) as ArrayBuffer;

  // 3) Zwracamy ArrayBuffer w Response — to przechodzi typy w Next 15/TS
  return new Response(arrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="cpd-portfolio.pdf"',
      // 'Cache-Control': 'no-store', // dodaj, jeśli nie chcesz cache
    },
  });
}

