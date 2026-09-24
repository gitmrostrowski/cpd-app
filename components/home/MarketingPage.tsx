import type { ReactNode } from "react";
import HomeFrame from "@/components/home/HomeFrame";
import { MarketingFooter, MarketingNav } from "@/components/home/MarketingChrome";
import "@/app/home-v15.css";
import "@/app/role-v15.css";

/** Rama publicznej podstrony w systemie Home v15 (nawigacja, stopka, style). */
export default function MarketingPage({ children, variant }: { children: ReactNode; variant: string }) {
  return <HomeFrame className={`crpe-home-v15 crpe-role page-${variant}`} navigation={<MarketingNav />} footer={<MarketingFooter />}>
    {children}
  </HomeFrame>;
}

/** Nagłówek podstrony: tytuł po lewej, opis i akcje po prawej (jak hero Home). */
export function PageHero({ status, title, lead, actions, note }: {
  status?: string; title: string; lead: string; actions?: ReactNode; note?: ReactNode;
}) {
  return <section className="hero role-hero page-hero" aria-labelledby="page-title">
    <div className="wrap">
      <div className="hero-grid">
        <div>
          {status ? <span className="pill pill-brand role-status">{status}</span> : null}
          <h1 id="page-title">{title}</h1>
        </div>
        <div className="hero-side">
          <p className="lead">{lead}</p>
          {actions}
          {note}
        </div>
      </div>
    </div>
  </section>;
}
