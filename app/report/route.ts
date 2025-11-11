import { NextRequest } from 'next/server'; import { createClient } from '@/lib/supabase'; import puppeteer from 'puppeteer';
export const dynamic = 'force-dynamic';
export async function GET(_req: NextRequest) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response('Unauthorized', { status: 401 });
  const [{ data: profile }, { data: activities }, { data: vp }] = await Promise.all([
    supabase.from('profiles').select('full_name, period_start').eq('id', auth.user.id).maybeSingle(),
    supabase.from('activities').select('title,activity_date,points,status,organizer').order('activity_date', { ascending: false }),
    supabase.from('v_user_points').select('*').eq('user_id', auth.user.id).maybeSingle()
  ]);
  const total = Number(vp?.total_points || 0);
  const periodStart = vp?.period_start || profile?.period_start || '';
  const periodEnd = vp?.period_end || '';
  const html = `<html><head><meta charset="utf-8"/><style>
    body {{ font-family: sans-serif; font-size: 12px; }}
    h1 {{ font-size: 20px; margin: 0 0 8px; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
    th, td {{ border: 1px solid #ddd; padding: 6px; text-align: left; }}
    th {{ background: #f5f5f5; }}
    .meta {{ margin: 8px 0; }}
    .footer {{ margin-top: 24px; font-size: 10px; color: #666; }}
  </style></head><body>
    <h1>Portfolio CPD</h1>
    <div class="meta">
      <div><strong>Użytkownik:</strong> ${profile?.full_name || '—'}</div>
      <div><strong>Okres rozliczeniowy:</strong> ${periodStart} → ${periodEnd}</div>
      <div><strong>Suma punktów:</strong> ${total}</div>
      <div><strong>Wygenerowano:</strong> ${new Date().toISOString()}</div>
    </div>
    <table><thead><tr><th>Tytuł</th><th>Data</th><th>Organizator</th><th>Status</th><th>Punkty</th></tr></thead>
    <tbody>${
      (activities || []).map((a:any) => `<tr><td>${a.title}</td><td>${a.activity_date}</td><td>${a.organizer || ''}</td><td>${a.status}</td><td>${Number(a.points).toFixed(2)}</td></tr>`).join('')
    }</tbody></table>
    <div class="footer">Raport informacyjny — zestawienie aktywności CPD.</div>
  </body></html>`;
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();
  return new Response(pdf, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="cpd-portfolio.pdf"' } });
}