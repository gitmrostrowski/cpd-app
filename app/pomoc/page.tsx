import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  FileText,
  FolderOpen,
  HelpCircle,
  KeyRound,
  LifeBuoy,
  UploadCloud,
} from "lucide-react";
import RoleContactModal from "@/components/RoleContactModal";

export const metadata: Metadata = {
  title: "Centrum pomocy CRPE",
  description: "Instrukcje i odpowiedzi dotyczące konta, Panelu CPD, aktywności, dokumentów, raportów i Bazy szkoleń.",
};

const wrap = "mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8";

const guides = [
  { icon: KeyRound, title: "Konto i logowanie", text: "Rejestracja, potwierdzenie adresu, logowanie i odzyskiwanie hasła.", links: ["Jak założyć konto", "Jak zalogować się ponownie", "Jak zresetować hasło"] },
  { icon: BarChart3, title: "Panel CPD", text: "Ustawienia zawodu, okresu, celu oraz interpretacja postępu i limitów.", links: ["Ustaw okres rozliczeniowy", "Zmień wymagany cel", "Sprawdź brakujące punkty"] },
  { icon: CalendarCheck2, title: "Aktywności", text: "Dodawanie, edytowanie i porządkowanie wpisów w ewidencji.", links: ["Dodaj aktywność", "Edytuj wpis", "Sprawdź status kompletności"] },
  { icon: UploadCloud, title: "Dokumenty", text: "Dodawanie pliku PDF lub zdjęcia i przypisywanie go do właściwej aktywności.", links: ["Dodaj certyfikat", "Zmień dokument", "Usuń załącznik"] },
  { icon: FileText, title: "Raporty", text: "Przygotowanie zestawienia wybranego okresu i eksport dokumentów.", links: ["Otwórz raport użytkownika", "Wybierz okres", "Pobierz zestawienie"] },
  { icon: FolderOpen, title: "Baza szkoleń", text: "Wyszukiwanie wydarzeń i dodawanie wybranych pozycji do planu CPD.", links: ["Wyszukaj szkolenie", "Użyj filtrów", "Dodaj wydarzenie do planu"] },
];

const faq = [
  ["Czy CRPE jest oficjalnym rejestrem?", "Nie. CRPE jest narzędziem do własnej ewidencji i nie zastępuje oficjalnych systemów ani wymaganej procedury rozliczenia."],
  ["Dlaczego nie widzę dokumentów bez logowania?", "Dokumenty i dane osobiste są związane z kontem i są dostępne po zalogowaniu."],
  ["Czy dodanie wydarzenia do planu oznacza zapis?", "Nie. Plan CPD pomaga zaplanować aktywność, ale zapis u organizatora odbywa się niezależnie."],
  ["Czy mogę dodać zdjęcie certyfikatu?", "Tak. Dokument możesz dodać jako PDF lub zdjęcie i przypisać do konkretnej aktywności."],
  ["Co zrobić, gdy punktacja wygląda nieprawidłowo?", "Sprawdź zawód, okres rozliczeniowy, wymagany cel, kategorię aktywności oraz przypisane limity."],
  ["Gdzie znajdę raport?", "Po zalogowaniu wybierz Raporty w głównym menu, a następnie raport użytkownika."],
];

export default function Page() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_80%_0%,rgba(125,211,252,0.25),transparent_32%),linear-gradient(180deg,#f8fbff_0%,#eef6fc_100%)] py-14 sm:py-20">
        <div className={wrap}>
          <div className="mx-auto max-w-3xl text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)]"><LifeBuoy className="h-7 w-7" /></span>
            <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-700">Centrum pomocy</p>
            <h1 className="mt-3 text-[40px] font-black leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-[58px]">Znajdź odpowiedź i wróć do pracy.</h1>
            <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-8 text-slate-600 sm:text-[18px]">Instrukcje prowadzą przez konto, Panel CPD, aktywności, dokumenty, raporty i Bazę szkoleń.</p>
          </div>
        </div>
      </section>

      <section className={`${wrap} py-14 sm:py-18`}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {guides.map(({ icon: Icon, title, text, links }) => (
            <article key={title} className="crpe-interactive-card rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_15px_42px_rgba(15,45,75,0.06)]">
              <span className="crpe-card-icon flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100"><Icon className="h-5 w-5" /></span>
              <h2 className="mt-4 text-[19px] font-black text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              <div className="mt-5 divide-y divide-slate-100 border-y border-slate-100">
                {links.map((item) => <p key={item} className="py-2.5 text-sm font-semibold text-slate-700">{item}</p>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#f6f9fd_0%,#eef4fa_100%)] py-14 sm:py-18">
        <div className={`${wrap} grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-10`}>
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100"><HelpCircle className="h-5 w-5" /></span>
            <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-700">Najczęstsze pytania</p>
            <h2 className="mt-2 text-[32px] font-black leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-[44px]">Odpowiedzi na typowe problemy.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">Nie znalazłeś odpowiedzi? Napisz do nas i opisz, na którym etapie pojawił się problem.</p>
            <div className="mt-5"><RoleContactModal role="ogolne" triggerLabel="Napisz do pomocy" /></div>
          </div>
          <div className="space-y-3">
            {faq.map(([question, answer]) => (
              <details key={question} className="group rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-[0_10px_28px_rgba(15,45,75,0.05)]">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-slate-950">{question}<span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-700 transition group-open:rotate-45">+</span></summary>
                <p className="pb-3 pr-8 text-sm leading-6 text-slate-600">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={`${wrap} py-14 sm:py-18`}>
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_55px_rgba(15,45,75,0.08)] sm:p-9">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-700">Szybkie przejście</p><h2 className="mt-2 text-[28px] font-black tracking-[-0.04em] text-slate-950 sm:text-[38px]">Otwórz narzędzie, którego potrzebujesz.</h2></div>
            <div className="flex flex-col gap-3 sm:flex-row"><Link href="/kalkulator" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white">Panel CPD<ArrowRight className="h-4 w-4" /></Link><Link href="/narzedzia" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-extrabold text-slate-700">Wszystkie narzędzia</Link></div>
          </div>
        </div>
      </section>
    </div>
  );
}
