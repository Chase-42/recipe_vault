"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({
  children,
  className = "",
}: PageTransitionProps) {
  return <div className={`h-full w-full ${className}`}>{children}</div>;
}

interface AnimatedBackButtonProps {
  onBack?: () => void;
  children: ReactNode;
  className?: string;
}

export function AnimatedBackButton({
  onBack,
  children,
  className = "",
}: AnimatedBackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <button type="button" onClick={handleBack} className={className}>
      {children}
    </button>
  );
}
