"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "../../providers";
import type { Recipe } from "~/types";
import LoadingSpinner from "./LoadingSpinner";
import { useMemo } from "react";
import Fuse from "fuse.js";
import RecipeCard from "./RecipeCard";
import { toast } from "sonner";

interface RecipesClientProps {
  initialRecipes: Recipe[];
}

const fetchRecipes = async (): Promise<Recipe[]> => {
  const response = await fetch("/api/recipes");
  if (!response.ok) {
    throw new Error("Failed to fetch recipes");
  }
  const data = (await response.json()) as Recipe[];
  return data;
};

const deleteRecipe = async (id: number) => {
  const response = await fetch(`/api/recipes?id=${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete recipe");
  }
};

const fuseOptions = {
  keys: ["name"],
  threshold: 0.4,
};

const RecipesClient: React.FC<RecipesClientProps> = ({ initialRecipes }) => {
  const { searchTerm } = useSearch();
  const queryClient = useQueryClient();

  const {
    data: recipes = initialRecipes,
    error,
    isLoading,
  } = useQuery<Recipe[]>({
    queryKey: ["recipes"],
    queryFn: fetchRecipes,
    initialData: initialRecipes,
  });

  const fuse = useMemo(() => new Fuse(recipes, fuseOptions), [recipes]);

  const filteredRecipes = useMemo(() => {
    if (!searchTerm) {
      return recipes;
    }
    const result = fuse.search(searchTerm);
    return result.map(({ item }) => item);
  }, [recipes, searchTerm, fuse]);

  const handleDelete = async (id: number) => {
    try {
      await deleteRecipe(id);
      await queryClient.invalidateQueries({ queryKey: ["recipes"] });
      toast.success("Recipe deleted successfully");
    } catch (error) {
      console.error("Failed to delete recipe:", error);
      toast.error("Failed to delete recipe");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-xl text-red-800">Error loading recipes</div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-4 p-4">
      {filteredRecipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} onDelete={handleDelete} />
      ))}
    </div>
  );
};

export default RecipesClient;
