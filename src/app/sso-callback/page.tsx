"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SSOCallback() {
  const router = useRouter();

  useEffect(() => {
    // Better Auth handles OAuth callbacks through its API routes
    // This page is a fallback - redirect to home
    router.push("/");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-32 w-32 animate-spin rounded-full border-b-4 border-t-4 border-red-800" />
    </div>
  );
}