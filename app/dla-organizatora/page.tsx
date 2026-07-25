import type { Metadata } from "next";
import RoleLandingPage from "@/components/RoleLandingPage";

export const metadata: Metadata = {
  title: "CRPE dla organizatora kształcenia",
  description: "Poznaj możliwy zakres obsługi wydarzeń, uczestników i dokumentacji edukacyjnej w CRPE.",
};

export default function Page() {
  return <RoleLandingPage role="organizator" />;
}
