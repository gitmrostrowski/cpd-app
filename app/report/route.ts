import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { createClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // puppeteer wymaga Node, nie Edge

export async function GET() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response('Unauthorized', { status: 401 });

  // ...tu pobierz dane do raportu (tak jak wcześniej)...

  const html = `<!doctype html><html><head><meta charset="utf-8" />
    <style>body{font-family:sans-serif;font-size:12px}</style></head>
    <body><h1>Raport CPD</h1>...</body></html>`;

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // ➊ PDF jako Buffer/Uint8Array
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  // ➋ Konwersja BUFFERA na ArrayBuffer (tego chce Response)
  const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
  const pdfArrayBuffer = pdfBuffer.buffer.slice(
    pdfBuffer.byteOffset,
    pdfBuffer.byteOffset + pdfBuffer.byteLength
  );

  return new Response(pdfArrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="cpd-portfolio.pdf"',
    },
  });
}
