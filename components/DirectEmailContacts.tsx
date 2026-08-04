"use client";

import { useState } from "react";
import { Check, Copy, Mail, Stethoscope, Building2, GraduationCap } from "lucide-react";

const contacts = [
  {
    label: "Pomoc dla medyków",
    email: "pomoc@crpe.pl",
    description: "Konto, aktywności, punkty, dokumenty i Panel CPD",
    icon: Stethoscope,
  },
  {
    label: "Kontakt ogólny i placówki",
    email: "kontakt@crpe.pl",
    description: "Współpraca, moduł organizacyjny i pozostałe sprawy",
    icon: Building2,
  },
  {
    label: "Organizatorzy i szkolenia",
    email: "zgloszenia@crpe.pl",
    description: "Zgłaszanie wydarzeń i korespondencja z organizatorami",
    icon: GraduationCap,
  },
];

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

export default function DirectEmailContacts() {
  const [copied, setCopied] = useState("");

  async function copy(email: string) {
    try {
      await copyText(email);
      setCopied(email);
      window.setTimeout(() => setCopied((current) => current === email ? "" : current), 2200);
    } catch {
      setCopied("");
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {contacts.map((contact) => {
        const Icon = contact.icon;
        const isCopied = copied === contact.email;
        return (
          <article key={contact.email} className="rounded-2xl border border-white/15 bg-white/[0.06] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.15)]">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-cyan-200 ring-1 ring-white/10">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-white">{contact.label}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-400">{contact.description}</p>
              </div>
            </div>
            <a href={`mailto:${contact.email}`} className="mt-5 inline-flex items-center gap-2 text-[15px] font-black text-white underline decoration-blue-400/70 underline-offset-4 hover:text-cyan-200">
              <Mail className="h-4 w-4" /> {contact.email}
            </a>
            <button type="button" onClick={() => copy(contact.email)} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-white/15" aria-label={`Kopiuj adres ${contact.email}`}>
              {isCopied ? <><Check className="h-4 w-4 text-emerald-300" /> Skopiowano</> : <><Copy className="h-4 w-4" /> Kopiuj adres</>}
            </button>
          </article>
        );
      })}
    </div>
  );
}
