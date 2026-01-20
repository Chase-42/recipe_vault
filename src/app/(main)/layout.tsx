"use client";
import { authClient } from "~/lib/auth-client";
import { TopNav } from "~/app/_components/topnav";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { data: session } = authClient.useSession();
  const navRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Hide navbar on focused pages like /img/[id]
  const isFocusedPage = pathname?.startsWith("/img/");
  const showNav = session && !isFocusedPage;

  useEffect(() => {
    const updateGridOffset = () => {
      if (navRef.current && showNav) {
        const height = navRef.current.offsetHeight;
        document.documentElement.style.setProperty(
          "--grid-offset",
          `${height}px`
        );
      } else {
        document.documentElement.style.setProperty("--grid-offset", "0px");
      }
    };

    const timeoutId = setTimeout(updateGridOffset, 0);
    window.addEventListener("resize", updateGridOffset);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateGridOffset);
    };
  }, [showNav]);

  return (
    <div className="grid h-screen grid-rows-[auto,1fr] print:grid-rows-[1fr]">
      {showNav && (
        <div ref={navRef}>
          <TopNav />
        </div>
      )}
      <main className="overflow-y-auto">{children}</main>
    </div>
  );
}