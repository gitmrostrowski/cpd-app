import "./globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CPD Dashboard",
  description: "Zbieraj i licz swoje punkty CME/CPD."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="min-h-screen bg-white text-slate-900">
        {children}
      </body>
    </html>
  );
}

