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
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (navRef.current && mainRef.current) {
      const updateGridOffset = () => {
        const navHeight = navRef.current?.offsetHeight || 0;
        // Calculate offset to align grid line with navbar bottom
        // We want the grid to start so that a line aligns with the navbar bottom
        const offset = -(navHeight % 40);
        mainRef.current!.style.backgroundPositionY = `${offset}px`;
      };
      
      updateGridOffset();
      
      // Update on resize in case navbar height changes
      const resizeObserver = new ResizeObserver(updateGridOffset);
      if (navRef.current) {
        resizeObserver.observe(navRef.current);
      }
      
      return () => resizeObserver.disconnect();
    }
  }, [session]);

  return (
    <div className="grid h-screen grid-rows-[auto,1fr] print:grid-rows-[1fr]">
      {session && (
        <div ref={navRef}>
          <TopNav />
        </div>
      )}
      <main 
        ref={mainRef}
        className="overflow-y-auto bg-black bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:40px_40px]"
      >
        {children}
      </main>
    </div>
  );
}