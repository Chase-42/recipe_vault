"use client";

import LoadingSpinner from "~/app/_components/LoadingSpinner";
import FullImagePage from "~/app/_components/FullImagePage";
import type { Recipe } from "~/types";

interface FullImagePageClientProps {
  recipeId: number;
  initialRecipe?: Recipe | null;
}

export default function FullImagePageClient({
  recipeId,
  initialRecipe,
}: FullImagePageClientProps) {
  return (
    <FullImagePage
      id={recipeId}
      initialRecipe={initialRecipe}
      loadingFallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingSpinner size="md" fullHeight={false} />
        </div>
      }
    />
  );
}
