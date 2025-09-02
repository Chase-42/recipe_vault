"use client";
import { SignedIn } from "@clerk/nextjs";
import { TopNav } from "~/app/_components/topnav";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="grid h-screen grid-rows-[auto,1fr] print:grid-rows-[1fr]">
      <SignedIn>
        <TopNav />
      </SignedIn>
      <div className="overflow-y-auto">{children}</div>
    </div>
  );
}