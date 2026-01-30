"use client";

import LoadingSpinner from "~/app/_components/LoadingSpinner";
import FullImagePage from "~/app/_components/FullImagePage";

interface FullImagePageClientProps {
  recipeId: number;
}

export default function FullImagePageClient({
  recipeId,
}: FullImagePageClientProps) {
  return (
    <FullImagePage
      id={recipeId}
      loadingFallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingSpinner size="md" fullHeight={false} />
        </div>
      }
    />
  );
}
