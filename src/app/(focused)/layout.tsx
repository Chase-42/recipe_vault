"use client";
import { useEffect } from "react";

interface FocusedLayoutProps {
  children: React.ReactNode;
}

export default function FocusedLayout({ children }: FocusedLayoutProps) {
  useEffect(() => {
    // Reset grid offset to 0 for focused pages (no navbar)
    document.documentElement.style.setProperty("--grid-offset", "0px");
  }, []);

  return <>{children}</>;
}