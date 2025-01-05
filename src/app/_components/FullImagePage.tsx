"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { fetchRecipe } from "~/utils/recipeService";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import type { Recipe } from "~/types";
import LoadingSpinner from "./LoadingSpinner";

interface FullPageImageViewProps {
  id: number;
  shouldSuspend?: boolean;
}

export default function FullPageImageView({ id }: FullPageImageViewProps) {
  const router = useRouter();

  const {
    data: recipe,
    error,
    isLoading,
  } = useQuery<Recipe>({
    queryKey: ["recipe", id],
    queryFn: () => fetchRecipe(id),
    enabled: !!id,
  });

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
            <ul className="list-inside list-disc space-y-1">
              {ingredients.map((ingredient, index) => (
                <li key={`${ingredient}-${index}`}>{ingredient}</li>
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
