"use client";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
export default function HomeAction() {
  const { user } = useAuth();
  return <Link href={user ? "/panel-cpd" : "/rejestracja"} className="btn btn-primary">
    {user ? "Przejdź do panelu" : "Załóż konto"}
  </Link>;
}
