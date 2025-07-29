"use client";

import { IconHeart } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { Edit, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AddToListModal } from "~/components/shopping-lists/AddToListModal";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
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
  onEdit,
  onAddToList,
  onFavoriteToggle,
}: {
  recipe: Recipe;
  onEdit: () => void;
  onAddToList: () => void;
  onFavoriteToggle: () => void;
}) {
  return (
    <div className="relative w-full bg-black">
      <div className="aspect-[3/1] md:aspect-[3.5/1] lg:aspect-[4/1] relative overflow-hidden">
        <Image
          src={recipe.imageUrl}
          alt={`Image of ${recipe.name}`}
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Overlapping card */}
      <div className="absolute inset-x-0 bottom-0 transform translate-y-1/2">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-background rounded-lg shadow-lg border p-4 md:p-6 flex items-center justify-between gap-4">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-medium">
              {recipe.name}
            </h1>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="h-9 w-9 rounded-full hover:bg-accent"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onAddToList}
                className="h-9 w-9 rounded-full hover:bg-accent"
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onFavoriteToggle}
                className="h-9 w-9 rounded-full hover:bg-accent"
              >
                <IconHeart
                  size={16}
                  className={cn(
                    "transition-colors duration-300",
                    recipe.favorite
                      ? "text-[hsl(var(--recipe-red))] fill-current"
                      : "text-foreground"
                  )}
                  strokeWidth={2}
                />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FullPageImageView({ id }: FullPageImageViewProps) {
  const router = useRouter();
  const [showAddToList, setShowAddToList] = useState(false);
  const { toggleFavorite } = useFavoriteToggle();
  const [checkedIngredients, setCheckedIngredients] = useState<
    Record<number, boolean>
  >({});

  const {
    data: recipe,
    error,
    isLoading,
  } = useQuery<Recipe>({
    queryKey: ["recipe", id],
    queryFn: () => fetchRecipe(id),
  });

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (error || !recipe) return <div>Failed to load recipe.</div>;

  const ingredients = recipe.ingredients.split("\n");
  const instructions = recipe.instructions.split("\n");

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <div className="flex-none">
        <RecipeImage
          recipe={recipe}
          onEdit={() => router.push(`/edit/${recipe.id}`)}
          onAddToList={() => setShowAddToList(true)}
          onFavoriteToggle={() => toggleFavorite(recipe)}
        />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-visible">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Ingredients */}
            <div>
              <h2 className="text-lg font-medium mb-4">Ingredients</h2>
              <ul className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Checkbox
                      id={`ingredient-${index}`}
                      checked={checkedIngredients[index] ?? false}
                      onCheckedChange={() => {
                        setCheckedIngredients((prev) => ({
                          ...prev,
                          [index]: !prev[index],
                        }));
                      }}
                      className="mt-1"
                    />
                    <label
                      htmlFor={`ingredient-${index}`}
                      className={cn(
                        "flex-1 text-base leading-tight",
                        checkedIngredients[index] &&
                          "text-muted-foreground line-through"
                      )}
                    >
                      {ingredient}
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div className="border-t md:border-t-0 md:border-l border-border md:pl-12 pt-8 md:pt-0">
              <h2 className="text-lg font-medium mb-4">Instructions</h2>
              <ol className="list-decimal space-y-4 pl-4">
                {instructions.map((instruction, index) => (
                  <li key={index} className="pl-2 text-base leading-relaxed">
                    {instruction}
                  </li>
                ))}
              </ol>

              {recipe.link && (
                <div className="mt-8">
                  <a
                    href={recipe.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View Original Recipe →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
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
