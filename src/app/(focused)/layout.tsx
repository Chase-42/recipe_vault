"use client";
import { useEffect } from "react";
import { authClient } from "~/lib/auth-client";

interface FocusedLayoutProps {
  children: React.ReactNode;
}

export default function FocusedLayout({ children }: FocusedLayoutProps) {
  const { data: session } = authClient.useSession();

  useEffect(() => {
    const updateGridOffset = () => {
      // Find TopNav in the DOM to measure its height
      const topNav = document.querySelector('nav[class*="border-b"]');
      if (topNav && session) {
        const height = topNav.getBoundingClientRect().height;
        document.documentElement.style.setProperty(
          "--grid-offset",
          `${height}px`
        );
      } else {
        document.documentElement.style.setProperty("--grid-offset", "0px");
      }
    };

    const rafId = requestAnimationFrame(() => {
      updateGridOffset();
    });

    window.addEventListener("resize", updateGridOffset);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateGridOffset);
    };
  }, [session]);

  if (!session) {
    return <main className="min-h-screen bg-grid-pattern">{children}</main>;
  }

  return (
    <div className="flex h-screen flex-col print:h-auto">
      <main className="flex-1 min-h-0 overflow-y-auto bg-grid-pattern">
        {children}
      </main>
    </div>
  );
}
