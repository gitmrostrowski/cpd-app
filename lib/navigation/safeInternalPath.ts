/**
 * Zwraca wyłącznie ścieżkę wewnątrz CRPE. Blokada backslasha jest istotna,
 * ponieważ parser URL traktuje go jak slash i zapis `/\\evil.example` mógłby
 * po normalizacji stać się przekierowaniem poza serwis.
 */
export function safeInternalPath(value: string | null, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return fallback;

  try {
    const base = "https://crpe.invalid";
    const parsed = new URL(value, base);
    if (parsed.origin !== base) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
