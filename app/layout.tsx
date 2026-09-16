// app/layout.tsx
import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

// Krój nagłówków (v6.28): ciepły grotesk z optycznymi rozmiarami i pełnym zestawem polskich znaków.
const display = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display-face",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "CRPE – panel CPD, aktywności, certyfikaty i raporty",
  description: "CRPE łączy panel CPD i kalkulator, ewidencję aktywności, certyfikaty, raport użytkownika oraz bazę szkoleń w jednym koncie.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${jakarta.variable} ${display.variable}`}>
      <body className={`${jakarta.className} antialiased`}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
