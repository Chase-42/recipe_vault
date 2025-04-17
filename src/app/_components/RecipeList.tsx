import { Suspense, lazy } from "react";
import type { Recipe } from "~/types";

// Lazy load the client component
const RecipeListClient = lazy(() => import("./RecipeListClient"));

interface RecipeListProps {
  initialData: {
    recipes: Recipe[];
    total: number;
    currentPage: number;
    totalPages: number;
  };
}

export default function RecipeList({ initialData }: RecipeListProps) {
  return (
    <div className="min-h-[200px]">
      <Suspense>
        <RecipeListClient initialData={initialData} />
      </Suspense>
    </div>
  );
}
