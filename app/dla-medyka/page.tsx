import type { Metadata } from "next";
import RoleLandingPage from "@/components/RoleLandingPage";

export const metadata: Metadata = {
  title: "CRPE dla medyka – punkty, aktywności i certyfikaty",
  description: "Prowadź własną ewidencję punktów, aktywności i certyfikatów w Panelu CPD.",
};

export default function Page() {
  return <RoleLandingPage role="medyk" />;
}
