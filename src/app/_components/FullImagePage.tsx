"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Checkbox } from "~/components/ui/checkbox";
import { fetchRecipe } from "~/utils/recipeService";
import type { Recipe } from "~/types";
import LoadingSpinner from "./LoadingSpinner";
import { useFavoriteToggle } from "~/hooks/useFavoriteToggle";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FullPageImageViewProps {
  id: number;
}

export default function FullPageImageView({ id }: FullPageImageViewProps) {
  const queryClient = useQueryClient();
  const [imageLoading, setImageLoading] = useState(() => {
    // Check if image was already preloaded
    return !queryClient.getQueryData(["preloadedImages", id]);
  });

  const {
    data: recipe,
    error,
    isLoading,
  } = useQuery<Recipe>({
    queryKey: ["recipe", id],
    queryFn: () => fetchRecipe(id),
    enabled: !!id,
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

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-xl text-red-800">Failed to load recipe.</div>
      </div>
    );
  }

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
        <div className="flex items-center justify-between border-b p-2">
          <div className="text-lg font-bold">{recipe.name}</div>
          <button
            onClick={() => toggleFavorite(recipe)}
            className="text-yellow-500 hover:text-yellow-600"
          >
            {recipe.favorite ? "★" : "☆"}
          </button>
        </div>

        {/* Ingredients section */}
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

      {/* Recipe image section */}
      <div className="relative flex-1 md:w-1/2">
        {recipe?.imageUrl ? (
          <div className="relative h-full w-full">
            <AnimatePresence mode="wait">
              {imageLoading && (
                <motion.div
                  className="absolute inset-0 backdrop-blur-xl"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className="absolute inset-0 bg-background/80"
                    style={{
                      backgroundImage: `url(${recipe.blurDataUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      filter: "blur(10px)",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              initial={{ opacity: imageLoading ? 0 : 1 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Image
                src={recipe.imageUrl}
                alt={`Image of ${recipe.name}`}
                className="object-contain"
                style={{ transform: "translateZ(0)" }}
                placeholder="blur"
                blurDataURL={recipe.blurDataUrl ?? ""}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={90}
                onLoadingComplete={() => setImageLoading(false)}
              />
            </motion.div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="italic text-gray-500">No image available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
