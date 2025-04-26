import React from "react";
import { cn } from "~/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  fullHeight?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-16 w-16 sm:h-24 sm:w-24",
  lg: "h-32 w-32 sm:h-48 sm:w-48 md:h-64 md:w-64",
};

const LoadingSpinner = ({
  className,
  size = "lg",
  fullHeight = true,
}: LoadingSpinnerProps) => (
  <div
    className={cn(
      "flex items-center justify-center",
      fullHeight && "h-full",
      className
    )}
  >
    <div
      className={cn(
        "animate-spin rounded-full border-b-4 border-t-4 border-red-800",
        sizeClasses[size]
      )}
    />
  </div>
);

export default LoadingSpinner;
