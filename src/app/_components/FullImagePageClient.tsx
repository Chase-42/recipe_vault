"use client";

import dynamic from "next/dynamic";
import type { Recipe } from "~/types";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { TopNav } from "~/app/_components/topnav";

const FullImagePage = dynamic(() => import("~/app/_components/FullImagePage"), {
  ssr: false,
});

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
        <div className="flex h-full w-full flex-col">
          <TopNav
            showBackButton
            showSearch={false}
            showActions={false}
            centerContent={<h1 className="text-xl font-semibold">Loading Recipe...</h1>}
          />
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex min-h-[60vh] items-center justify-center">
              <LoadingSpinner size="md" fullHeight={false} />
            </div>
          </div>
        </div>
      }
    />
  );
}
