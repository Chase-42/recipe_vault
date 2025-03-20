import { Suspense, lazy } from "react";
import type { Recipe } from "~/types";
import LoadingSpinner from "./LoadingSpinner";

// Lazy load the client component
const RecipeListClient = lazy(() => import("./RecipeListClient"));

interface RecipeListProps {
  initialData: {
    recipes: Recipe[];
    total: number;
  };
}

export default function RecipeList({ initialData }: RecipeListProps) {
  return (
    <div className="min-h-[200px]">
      <Suspense
        fallback={
          <div className="flex min-h-[200px] items-center justify-center">
            <LoadingSpinner />
          </div>
        }
      >
        <RecipeListClient initialData={initialData} />
      </Suspense>
    </div>
  );
}
