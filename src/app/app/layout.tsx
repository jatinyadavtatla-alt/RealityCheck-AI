import type { ReactNode } from "react";
import { getCurrentUser, DEFAULT_USER } from "@/server/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = (await getCurrentUser()) ?? DEFAULT_USER;
  return (
    <AppShell user={{ name: user.name, email: user.email }}>{children}</AppShell>
  );
}
