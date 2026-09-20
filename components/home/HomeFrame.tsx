"use client";
import { useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import Header from "@/components/Header";
import { initializeHome } from "./initializeHome";

/** Static Home content stays server-rendered; only navigation observes the session. */
export default function HomeFrame({ children, navigation, footer, className }: {
  children: React.ReactNode; navigation: React.ReactNode;
  footer: React.ReactNode; className: string;
}) {
  const { user } = useAuth();
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => root.current ? initializeHome(root.current) : undefined, [user?.id]);
  return <>
    {user ? <Header /> : null}
    <div ref={root} className={className}>
      <a className="skip-home" href="#kim-jestes">Przejdź do wyboru odbiorcy</a>
      {user ? null : navigation}
      <main id="home-content">{children}</main>
      {footer}
    </div>
  </>;
}
