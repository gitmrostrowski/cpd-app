"use client";
import { usePathname } from "next/navigation";
import { MARKETING_PATHS } from "@/components/home/MarketingChrome";

/** Strony marketingowe mają własną nawigację i stopkę (MarketingChrome). */
export default function HomeChrome({ children }: { children: React.ReactNode }) {
  return MARKETING_PATHS.includes(usePathname()) ? null : children;
}
