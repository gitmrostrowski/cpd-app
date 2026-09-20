"use client";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
export default function HomeAudience({ children }: { children: React.ReactNode }) {
 const { user } = useAuth();
 return <div className="hero-choose">{user ? <div id="kim-jestes" tabIndex={-1} className="home-account-links"><h2 id="dla-kogo">Przejdź do swoich narzędzi</h2><div><Link href="/panel-cpd">Panel CPD →</Link><Link href="/placowka">Panel placówki →</Link><Link href="/baza-szkolen">Baza szkoleń →</Link></div></div> : children}</div>;
}

