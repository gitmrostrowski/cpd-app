import { permanentRedirect } from "next/navigation";

/** Historyczny angielski adres — treść ma jeden kanoniczny URL. */
export default function ActivitiesAliasPage() {
  permanentRedirect("/aktywnosci");
}
