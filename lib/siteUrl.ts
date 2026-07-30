export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const browserUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const url = configuredUrl || browserUrl || "https://www.crpe.pl";

  return url.replace(/\/+$/, "");
}
