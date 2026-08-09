import { permanentRedirect } from "next/navigation";

/**
 * Trasa historyczna. Produkt nazywa się „Panel CPD” w nawigacji, stopce,
 * na /narzedzia i w pomocy — adres /kalkulator mówił co innego.
 * Zostawiamy przekierowanie, żeby stare linki i zakładki nadal działały.
 */
export default function KalkulatorAliasPage() {
  permanentRedirect("/panel-cpd");
}
