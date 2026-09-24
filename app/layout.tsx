// app/layout.tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import "./crpe-visual-v6-28-2.css";
import "./home-v15.css";
import "./app-v15.css";
import { AuthProvider } from "@/components/AuthProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomeChrome from "@/components/HomeChrome";
import PageContent from "@/components/PageContent";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CRPE – panel CPD, aktywności, certyfikaty i raporty",
  description: "CRPE łączy panel CPD i kalkulator, ewidencję aktywności, certyfikaty, raport użytkownika oraz bazę szkoleń w jednym koncie.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={jakarta.variable}>
      <body className={`${jakarta.className} antialiased`}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <HomeChrome><Header /></HomeChrome>
            <PageContent>{children}</PageContent>
            <HomeChrome><Footer /></HomeChrome>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
