import type { MetadataRoute } from "next";
import { fetchPublicTrainings } from "@/lib/data/crpe";
import { getSiteUrl } from "@/lib/siteUrl";
import { publicSupabaseServer } from "@/lib/supabase/publicServer";
import { trainingPath } from "@/lib/trainings/public";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const staticPaths = ["", "/baza-szkolen", "/dla-medyka", "/dla-placowki", "/kalkulator", "/narzedzia", "/pomoc", "/kontakt"];
  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "/baza-szkolen" ? "daily" : "monthly",
    priority: path === "" ? 1 : path === "/baza-szkolen" ? 0.9 : 0.7,
  }));

  try {
    const trainings = await fetchPublicTrainings(publicSupabaseServer());
    return [
      ...staticEntries,
      ...trainings.map((training) => ({
        url: `${siteUrl}${trainingPath(training)}`,
        lastModified: training.updated_at || training.created_at || undefined,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch (error) {
    console.error("Dynamic training sitemap load failed", error);
    return staticEntries;
  }
}
