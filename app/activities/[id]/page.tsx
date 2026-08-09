import { permanentRedirect } from "next/navigation";

export default async function ActivityDetailsAliasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  permanentRedirect(`/aktywnosci/${encodeURIComponent(id)}`);
}
