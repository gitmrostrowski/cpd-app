// app/report/route.ts
export async function GET() {
  return new Response("<!doctype html><html><body>Report OK</body></html>", {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
