"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Checkbox } from "~/components/ui/checkbox";
import { fetchRecipe } from "~/utils/recipeService";
import type { Recipe } from "~/types";
import LoadingSpinner from "./LoadingSpinner";

interface FullPageImageViewProps {
  id: number;
  shouldSuspend?: boolean;
}

export default function FullPageImageView({ id }: FullPageImageViewProps) {
  const {
    data: recipe,
    error,
    isLoading,
  } = useQuery<Recipe>({
    queryKey: ["recipe", id],
    queryFn: () => fetchRecipe(id),
    enabled: !!id,
  });

  // State for checked ingredients
  const [checkedIngredients, setCheckedIngredients] = useState<
    Record<string, boolean>
  >({});

  // Load checked state from localStorage on mount
  useEffect(() => {
    if (recipe) {
      const storedChecked = localStorage.getItem(`recipe-${id}-ingredients`);
      if (storedChecked) {
        setCheckedIngredients(
          JSON.parse(storedChecked) as Record<string, boolean>,
        );
      }
    }
  }, [id, recipe]);

  // Save to localStorage whenever checked state changes
  useEffect(() => {
    if (recipe) {
      localStorage.setItem(
        `recipe-${id}-ingredients`,
        JSON.stringify(checkedIngredients),
      );
    }
  }, [checkedIngredients, id, recipe]);

  const handleIngredientToggle = (ingredient: string, index: number) => {
    const key = `${ingredient}-${index}`;
    setCheckedIngredients((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-xl text-red-800">Failed to load recipe.</div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-xl text-red-800">Recipe not found.</div>
      </div>
    );
  }

  // Handle ingredients and instructions safely
  const ingredients = recipe.ingredients?.split("\n") ?? [];
  const instructions = recipe.instructions?.split("\n") ?? [];

  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      {/* Recipe details section */}
      <div className="relative flex flex-col border-b p-4 md:w-1/2 md:border-b-0 md:border-r">
        <div className="border-b p-2 text-center text-lg font-bold">
          {recipe.name}
        </div>

        {/* Ingredients section */}
        <div className="border-b p-4">
          <h3 className="mb-2 text-base font-semibold">Ingredients:</h3>
          {ingredients.length > 0 ? (
            <ul className="space-y-3">
              {ingredients.map((ingredient, index) => {
                const key = `${ingredient}-${index}`;
                return (
                  <li key={key} className="flex items-start space-x-2">
                    <Checkbox
                      id={key}
                      checked={checkedIngredients[key] ?? false}
                      onCheckedChange={() =>
                        handleIngredientToggle(ingredient, index)
                      }
                      className="mt-1"
                    />
                    <label
                      htmlFor={key}
                      className={`text-sm ${
                        checkedIngredients[key]
                          ? "text-gray-500 line-through"
                          : ""
                      }`}
                    >
                      {ingredient}
                    </label>
                  </li>
                );
              })}
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
                <li key={`${instruction}-${index}`}>{instruction}</li>
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
      <div className="relative flex w-full items-center justify-center p-4 md:w-1/2">
        {recipe.imageUrl ? (
          <div className="relative h-96 w-full md:h-full">
            <Image
              src={recipe.imageUrl}
              alt={`Image of ${recipe.name}`}
              className="object-contain"
              placeholder="blur"
              blurDataURL={recipe.blurDataUrl}
              fill
              priority
            />
          </div>
        ) : (
          <p className="italic text-gray-500">No image available.</p>
        )}
      </div>
    </div>
  );
}
