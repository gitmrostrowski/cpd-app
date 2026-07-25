import type { Metadata } from "next";
import RoleLandingPage from "@/components/RoleLandingPage";

export const metadata: Metadata = {
  title: "CRPE dla placówki – ewidencja i kompletność zespołu",
  description: "Poznaj aktualny i rozwijany zakres CRPE dla placówek oraz jednostek organizacyjnych.",
};

export default function Page() {
  return <RoleLandingPage role="placowka" />;
}
