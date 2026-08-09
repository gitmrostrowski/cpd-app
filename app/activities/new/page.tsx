import { permanentRedirect } from "next/navigation";

/** Zachowuje działanie starych zakładek po przeniesieniu trasy. */
export default function NewActivityAliasPage() {
  permanentRedirect("/aktywnosci/new");
}
