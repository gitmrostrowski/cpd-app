import { MarketingFooter } from "@/components/home/MarketingChrome";

/**
 * Stopka całej aplikacji: ta sama co na Home i stronach ról (system v15).
 * Kontener z klasą .crpe-home-v15 daje jej style bez wpływu na resztę ekranu.
 */
export default function Footer() {
  return (
    <div data-crpe-chrome="true" className="crpe-home-v15 crpe-shell-footer" data-print="hide">
      <MarketingFooter />
    </div>
  );
}
