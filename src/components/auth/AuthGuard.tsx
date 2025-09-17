"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "~/app/_components/LoadingSpinner";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      fallback ?? (
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )
    );
  }

  if (!isSignedIn) {
    return (
      fallback ?? (
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )
    );
  }

  return <>{children}</>;
}