"use client";
import { usePathname } from "next/navigation";
export default function HomeChrome({ children }: { children: React.ReactNode }) {
  return usePathname() === "/" ? null : children;
}
