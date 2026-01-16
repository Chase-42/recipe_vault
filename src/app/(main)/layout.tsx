"use client";
import { authClient } from "~/lib/auth-client";
import { TopNav } from "~/app/_components/topnav";
import { useEffect, useRef } from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { data: session } = authClient.useSession();
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateGridOffset = () => {
      if (navRef.current && session) {
        const height = navRef.current.offsetHeight;
        document.documentElement.style.setProperty(
          "--grid-offset",
          `${height}px`
        );
      } else {
        document.documentElement.style.setProperty("--grid-offset", "0px");
      }
    };

    // Use a small delay to ensure navbar is rendered
    const timeoutId = setTimeout(updateGridOffset, 0);
    window.addEventListener("resize", updateGridOffset);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateGridOffset);
    };
  }, [session]);

  return (
    <div className="grid h-screen grid-rows-[auto,1fr] print:grid-rows-[1fr]">
      {session && (
        <div ref={navRef}>
          <TopNav />
        </div>
      )}
      <main className="overflow-y-auto bg-grid-pattern">
        {children}
      </main>
    </div>
  );
}