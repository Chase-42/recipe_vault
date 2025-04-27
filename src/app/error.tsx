"use client";

import { Home, RefreshCcw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">Something went wrong!</h2>
      <p className="text-sm text-muted-foreground">
        {error?.message ?? "An unexpected error occurred"}
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="outline">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <Button
          onClick={() => {
            window.location.href = "/";
          }}
          variant="outline"
        >
          <Home className="mr-2 h-4 w-4" />
          Go Home
        </Button>
      </div>
    </div>
  );
}
