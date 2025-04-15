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
import { ShoppingCart, Pencil } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { IconHeart } from "@tabler/icons-react";
import { cn } from "~/lib/utils";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

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
    <div className="flex h-[calc(100vh-2rem)] max-w-full flex-col overflow-y-auto md:flex-row md:overflow-hidden">
      {/* Recipe details section */}
      <div className="flex flex-col border-b p-4 md:w-1/2 md:overflow-y-auto md:border-b-0 md:border-r">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-2">
          <div className="text-lg font-bold">{recipe.name}</div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAddToList(true)}
                    title="Add to shopping list"
                    className="h-10 w-10"
                  >
                    <ShoppingCart className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add to shopping list</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/edit/${recipe.id}`)}
                    title="Edit recipe"
                    className="h-10 w-10"
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit recipe</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFavorite(recipe)}
                    title="Toggle favorite"
                    className={cn(
                      "h-10 w-10",
                      recipe.favorite && "text-red-500",
                    )}
                  >
                    <IconHeart
                      className={cn(
                        "h-5 w-5 transition-colors",
                        recipe.favorite && "fill-current",
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {recipe.favorite
                    ? "Remove from favorites"
                    : "Add to favorites"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto">
          <div className="border-b p-4">
            <h3 className="mb-3 text-base font-semibold">Ingredients:</h3>
            {ingredients.length > 0 ? (
              <ul className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <Checkbox
                      id={`ingredient-${index}`}
                      className="mt-1 h-5 w-5"
                      checked={checkedIngredients[index] ?? false}
                      onCheckedChange={() => handleIngredientToggle(index)}
                    />
                    <label
                      htmlFor={`ingredient-${index}`}
                      className={`flex-1 text-sm ${
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
            <h3 className="mb-3 text-base font-semibold">Instructions:</h3>
            {instructions.length > 0 ? (
              <ol className="list-inside list-decimal space-y-2">
                {instructions.map((instruction, index) => (
                  <li key={index} className="text-sm">
                    {instruction}
                  </li>
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
                className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
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
      <div className="relative flex-1 overflow-hidden md:w-1/2">
        <Suspense
          fallback={
            <LoadingSpinner size="md" fullHeight={false} className="p-8" />
          }
        >
          {recipe.imageUrl ? (
            <div className="relative h-full w-full">
              <Image
                src={recipe.imageUrl}
                alt={recipe.name}
                className="object-contain"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={true}
                onLoadingComplete={() => setImageLoading(false)}
              />
            </div>
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
