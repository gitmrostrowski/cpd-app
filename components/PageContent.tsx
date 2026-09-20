"use client";
import { usePathname } from "next/navigation";
export default function PageContent({ children }: { children: React.ReactNode }) {
  return usePathname() === "/" ? <div className="flex-1">{children}</div> : <main className="flex-1">{children}</main>;
}
