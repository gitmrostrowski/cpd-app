// app/report/route.ts
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // Minimalny HTML – podmienisz później na swoje dane
  const html = `<!doctype html><html lang="pl">
  <head>
    <meta charSet="utf-8" />
    <title>Raport CPD</title>
    <style>
      body{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;font-size:12px;color:#111}
      h1{font-size:20px;margin:0 0 8px}
      .box{border:1px solid #ddd;border-radius:8px;padding:12px;margin:12px 0}
      .muted{color:#555}
    </style>
  </head>
  <body>
    <h1>Raport CPD</h1>
    <div class="muted">PDF wygenerowany na Vercel (puppeteer-core + chromium)</div>
    <div class="box">
      <strong>Użytkownik:</strong> —<br/>
      <strong>Suma punktów:</strong> —<br/>
      <strong>Okres:</strong> —<br/>
    </div>
  </body></html>`;

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  // ⬇️ TO JEST KLUCZOWE – tworzymy page, zanim go użyjemy
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 }); // opcjonalne
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  // Najprościej: zwróć Blob, wtedy TS nie marudzi
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });

  return new Response(blob, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="cpd-portfolio.pdf"',
    },
  });
}

