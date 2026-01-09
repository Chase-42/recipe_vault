"use client";

import type { Recipe } from "~/types";
import RecipeCard from "./RecipeCard";
import LoadingSpinner from "./LoadingSpinner";

interface RecipeGridProps {
  recipes: Recipe[];
  isLoading: boolean;
  currentPage: number;
  onDelete: (id: number) => void;
  onFavoriteToggle: (id: number) => void;
}

export default function RecipeGrid({
  recipes,
  isLoading,
  currentPage,
  onDelete,
  onFavoriteToggle,
}: RecipeGridProps) {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (recipes.length === 0) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center text-lg text-muted-foreground">
        No recipes found
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap justify-center gap-6 pb-8">
        {recipes.map((recipe, index) => (
          <div
            key={recipe.id}
            className="w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)]"
          >
            <RecipeCard
              recipe={recipe}
              onDelete={onDelete}
              onFavoriteToggle={onFavoriteToggle}
              priority={currentPage === 1 && index < 8}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
