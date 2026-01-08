"use client";
import { authClient } from "~/lib/auth-client";
import { TopNav } from "~/app/_components/topnav";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { data: session } = authClient.useSession();

  return (
    <div className="grid h-screen grid-rows-[auto,1fr] print:grid-rows-[1fr]">
      {session && <TopNav />}
      <main className="overflow-y-auto">{children}</main>
    </div>
  );
}