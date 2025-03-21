"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Checkbox } from "~/components/ui/checkbox";
import { fetchRecipe } from "~/utils/recipeService";
import type { Recipe } from "~/types";
import LoadingSpinner from "./LoadingSpinner";
import { useFavoriteToggle } from "~/hooks/useFavoriteToggle";
import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "~/components/ui/button";
import { AddToListModal } from "~/components/shopping-lists/AddToListModal";
import { ShoppingCart } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { IconHeart } from "@tabler/icons-react";
import { cn } from "~/lib/utils";

interface FullPageImageViewProps {
  id: number;
}

function RecipeImage({
  recipe,
  imageLoading,
  setImageLoading,
}: {
  recipe: Recipe;
  imageLoading: boolean;
  setImageLoading: (loading: boolean) => void;
}) {
  return (
    <div className="relative h-full w-full">
      <AnimatePresence>
        {/* Blur placeholder */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: imageLoading ? 1 : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 overflow-hidden"
          style={{
            backgroundImage: `url(${recipe.blurDataUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(20px)",
            transform: "scale(1.1)",
          }}
        />
        {/* Main image */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: imageLoading ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className="relative h-full w-full"
        >
          <Image
            src={recipe.imageUrl}
            alt={`Image of ${recipe.name}`}
            className="object-contain"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            quality={90}
            onLoad={() => setImageLoading(false)}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function FullPageImageView({ id }: FullPageImageViewProps) {
  const queryClient = useQueryClient();
  const [imageLoading, setImageLoading] = useState(true);
  const [showAddToList, setShowAddToList] = useState(false);

  // Get cached recipe data immediately
  const cachedRecipe = queryClient.getQueryData<Recipe>(["recipe", id]);

  const {
    data: recipe,
    error,
    isLoading,
  } = useQuery<Recipe>({
    queryKey: ["recipe", id],
    queryFn: () => fetchRecipe(id),
    enabled: !!id,
    placeholderData: cachedRecipe,
  });

  const { toggleFavorite } = useFavoriteToggle();
  const [checkedIngredients, setCheckedIngredients] = useState<
    Record<number, boolean>
  >({});

  // Load checked state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`recipe-${id}-ingredients`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<number, boolean>;
        setCheckedIngredients(parsed);
      } catch (e) {
        console.error("Failed to parse stored ingredients");
      }
    }
  }, [id]);

  // Save to localStorage when checked state changes
  useEffect(() => {
    if (Object.keys(checkedIngredients).length > 0) {
      localStorage.setItem(
        `recipe-${id}-ingredients`,
        JSON.stringify(checkedIngredients),
      );
    }
  }, [checkedIngredients, id]);

  const handleIngredientToggle = (index: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Loading state
  if (isLoading && !cachedRecipe) {
    return <LoadingSpinner size="lg" />;
  }

  // Error state
  if (error instanceof Error) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-xl text-red-800">Failed to load recipe.</div>
      </div>
    );
  }

  // Not found state
  if (!recipe) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-xl text-red-800">Recipe not found.</div>
      </div>
    );
  }

  const ingredients = recipe.ingredients.split("\n");
  const instructions = recipe.instructions.split("\n");

  return (
    <div className="flex h-screen w-full flex-col md:flex-row">
      {/* Recipe details section */}
      <div className="flex flex-col border-b p-4 md:w-1/2 md:overflow-y-auto md:border-b-0 md:border-r">
        <div className="relative z-10 flex items-center justify-between border-b p-2">
          <div className="text-lg font-bold">{recipe.name}</div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAddToList(true)}
                    title="Add to shopping list"
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add to shopping list</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {recipe.favorite ? (
              <button
                type="button"
                onClick={() => toggleFavorite(recipe)}
                className="transition-opacity duration-300"
                aria-label="Unfavorite"
              >
                <IconHeart
                  size={24}
                  className="text-red-500 transition-colors duration-300"
                  strokeWidth={2}
                  fill="currentColor"
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => toggleFavorite(recipe)}
                className="transition-opacity duration-300"
                aria-label="Favorite"
              >
                <IconHeart
                  size={24}
                  className="text-white transition-colors duration-300"
                  strokeWidth={2}
                />
              </button>
            )}
          </div>
        </div>

        {/* Ingredients section */}
        <div className="relative z-10 flex-1">
          <div className="border-b p-4">
            <h3 className="mb-2 text-base font-semibold">Ingredients:</h3>
            {ingredients.length > 0 ? (
              <ul className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <Checkbox
                      id={`ingredient-${index}`}
                      className="mt-1"
                      checked={checkedIngredients[index] ?? false}
                      onCheckedChange={() => handleIngredientToggle(index)}
                    />
                    <label
                      htmlFor={`ingredient-${index}`}
                      className={`text-sm ${
                        checkedIngredients[index]
                          ? "text-gray-500 line-through"
                          : ""
                      }`}
                    >
                      {ingredient}
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="italic text-gray-500">No ingredients listed.</p>
            )}
          </div>

          {/* Instructions section */}
          <div className="border-b p-4">
            <h3 className="mb-2 text-base font-semibold">Instructions:</h3>
            {instructions.length > 0 ? (
              <ol className="list-inside list-decimal space-y-1">
                {instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            ) : (
              <p className="italic text-gray-500">No instructions provided.</p>
            )}
          </div>

          {/* View Full Recipe link */}
          <div className="p-4 text-center">
            {recipe.link ? (
              <a
                href={recipe.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View Full Recipe
              </a>
            ) : (
              <p className="italic text-gray-500">No link available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recipe image section */}
      <div className="relative flex-1 md:w-1/2">
        <Suspense
          fallback={
            <LoadingSpinner size="md" fullHeight={false} className="p-8" />
          }
        >
          {recipe.imageUrl ? (
            <RecipeImage
              recipe={recipe}
              imageLoading={imageLoading}
              setImageLoading={setImageLoading}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="italic text-gray-500">No image available.</p>
            </div>
          )}
        </Suspense>
      </div>

      <AddToListModal
        isOpen={showAddToList}
        onClose={() => setShowAddToList(false)}
        ingredients={ingredients}
        recipeId={recipe.id}
        recipeName={recipe.name}
      />
    </div>
  );
}
