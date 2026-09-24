"use client";
import { usePathname } from "next/navigation";
import { MARKETING_PATHS } from "@/components/home/MarketingChrome";

/** Strony marketingowe mają własny <main> w HomeFrame. */
export default function PageContent({ children }: { children: React.ReactNode }) {
  return MARKETING_PATHS.includes(usePathname()) ? <div className="flex-1">{children}</div> : <main className="flex-1">{children}</main>;
}
