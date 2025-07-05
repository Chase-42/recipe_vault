"use client";

import { IconHeart } from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Edit, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AddToListModal } from "~/components/shopping-lists/AddToListModal";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useFavoriteToggle } from "~/hooks/useFavoriteToggle";
import type { Recipe } from "~/types";
import { cn } from "~/lib/utils";
import { fetchRecipe } from "~/utils/recipeService";
import LoadingSpinner from "./LoadingSpinner";

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
    <div className="relative w-full">
      <AnimatePresence>
        {/* Blur placeholder */}
        <motion.div
          key="blur-placeholder"
          initial={{ opacity: 1 }}
          animate={{ opacity: imageLoading ? 1 : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
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
          key="main-image"
          initial={{ opacity: 0 }}
          animate={{ opacity: imageLoading ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className="relative w-full"
        >
          <Image
            src={recipe.imageUrl}
            alt={`Image of ${recipe.name}`}
            width={0}
            height={0}
            priority
            sizes="100vw"
            quality={90}
            className="w-full"
            onLoad={() => setImageLoading(false)}
            onError={(e) => {
              console.error("Image failed to load:", e);
              setImageLoading(false);
            }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function FullPageImageView({ id }: FullPageImageViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [imageLoading, setImageLoading] = useState(true);
  const [showAddToList, setShowAddToList] = useState(false);

  // Get cached recipe data immediately
  const cachedRecipe = queryClient.getQueryData<Recipe>(["recipe", id]);

  const {
    data: recipe,
    error,
    isLoading,
  } = useQuery<Recipe, Error>({
    queryKey: ["recipe", id],
    queryFn: () => fetchRecipe(id),
    enabled: !!id,
    initialData: cachedRecipe,
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
      } catch (_e) {
        console.error("Failed to parse stored ingredients");
      }
    }
  }, [id]);

  // Save to localStorage when checked state changes
  useEffect(() => {
    if (Object.keys(checkedIngredients).length > 0) {
      localStorage.setItem(
        `recipe-${id}-ingredients`,
        JSON.stringify(checkedIngredients)
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
    return <LoadingSpinner size="lg" />;
  }

  const ingredients = recipe.ingredients.split("\n");
  const instructions = recipe.instructions.split("\n");

  return (
    <div className="grid h-screen max-h-screen grid-cols-1 overflow-hidden md:grid-cols-2">
      {/* Left side - Recipe details */}
      <div className="flex h-full flex-col overflow-hidden border-r">
        {/* Mobile image - Moved to top */}
        <div className="relative h-48 md:hidden">
          {recipe.imageUrl && (
            <Image
              src={recipe.imageUrl}
              alt={recipe.name}
              className="object-cover"
              fill
              priority
              sizes="100vw"
            />
          )}
        </div>

        {/* Header - Made sticky */}
        <div className="sticky top-0 z-10 border-b bg-background px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold md:text-lg">{recipe.name}</div>
            {/* Desktop buttons */}
            <div className="hidden items-center gap-2 md:flex">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/edit/${recipe.id}`)}
                    >
                      <Edit className="h-4 w-4" />
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
                      onClick={() => setShowAddToList(true)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add to shopping list</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {recipe.favorite ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorite(recipe)}
                        className="transition-opacity duration-300"
                        aria-label="Unfavorite"
                      >
                        <IconHeart
                          size={24}
                          className="text-[hsl(var(--recipe-red))] transition-colors duration-300"
                          strokeWidth={2}
                          fill="currentColor"
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove from favorites</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorite(recipe)}
                        className="transition-opacity duration-300"
                        aria-label="Favorite"
                      >
                        <IconHeart
                          size={24}
                          className="text-white transition-colors duration-300"
                          strokeWidth={2}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add to favorites</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Ingredients */}
          <div className="border-b p-4 md:p-3">
            <h3 className="mb-4 text-lg font-semibold md:mb-2 md:text-base">
              Ingredients:
            </h3>
            <ul className="space-y-3 md:space-y-2">
              {ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start gap-3 md:gap-2">
                  <Checkbox
                    id={`ingredient-${index}`}
                    checked={checkedIngredients[index] ?? false}
                    onCheckedChange={() => handleIngredientToggle(index)}
                    className="mt-1 h-5 w-5 md:h-4 md:w-4"
                  />
                  <label
                    htmlFor={`ingredient-${index}`}
                    className={cn(
                      "flex-1 text-lg leading-tight md:text-base",
                      checkedIngredients[index] && "text-gray-500 line-through"
                    )}
                  >
                    {ingredient}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="border-b p-4 md:p-3">
            <h3 className="mb-4 text-lg font-semibold md:mb-2 md:text-base">
              Instructions:
            </h3>
            <ol className="list-decimal space-y-4 pl-4 md:space-y-2">
              {instructions.map((instruction, index) => (
                <li
                  key={index}
                  className="pl-2 text-lg leading-tight md:text-base"
                >
                  {instruction}
                </li>
              ))}
            </ol>
          </div>

          {/* Link */}
          {recipe.link && (
            <div className="p-4 md:p-3">
              <a
                href={recipe.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg bg-gray-100 px-4 py-2 text-blue-500 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                View Original Recipe
              </a>
            </div>
          )}
        </div>

        {/* Mobile bottom action bar - Made sticky */}
        <div className="sticky bottom-0 z-10 flex items-center justify-around border-t bg-background/80 px-6 py-4 backdrop-blur-sm md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/edit/${recipe.id}`)}
            className="h-12 w-12 rounded-full"
          >
            <Edit className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAddToList(true)}
            className="h-12 w-12 rounded-full"
          >
            <ShoppingCart className="h-6 w-6" />
          </Button>

          <button
            type="button"
            onClick={() => toggleFavorite(recipe)}
            className="flex h-12 w-12 items-center justify-center rounded-full"
            aria-label={recipe.favorite ? "Unfavorite" : "Favorite"}
          >
            <IconHeart
              size={32}
              className={cn(
                "transition-colors duration-300",
                recipe.favorite
                  ? "fill-current text-[hsl(var(--recipe-red))]"
                  : "text-white"
              )}
              strokeWidth={2}
            />
          </button>
        </div>
      </div>

      {/* Right side - Desktop Image */}
      <div className="relative hidden h-full md:flex md:items-center">
        {recipe.imageUrl && (
          <RecipeImage
            recipe={recipe}
            imageLoading={imageLoading}
            setImageLoading={setImageLoading}
          />
        )}
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
