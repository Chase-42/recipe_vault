"use client";

import { useState } from "react";
import {
  ExternalLink,
  ChefHat,
  Edit,
  ShoppingCart,
  ArrowLeft,
} from "lucide-react";
import { IconHeart } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  PageTransition,
  AnimatedBackButton,
} from "~/components/ui/page-transition";

import { Button } from "~/components/ui/button";

import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import { AddToListModal } from "~/components/shopping-lists/AddToListModal";
import { useFavoriteToggle } from "~/hooks/useFavoriteToggle";
import type { Recipe } from "~/types";
import { cn } from "~/lib/utils";
import { fetchRecipe } from "~/utils/recipeService";
import LoadingSpinner from "./LoadingSpinner";

interface FullPageImageViewProps {
  id: number;
}

export default function FullImageView({ id }: FullPageImageViewProps) {
  const router = useRouter();
  const [showAddToList, setShowAddToList] = useState(false);
  const { toggleFavorite } = useFavoriteToggle();
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(
    new Set()
  );

  const {
    data: recipe,
    error,
    isLoading,
  } = useQuery<Recipe>({
    queryKey: ["recipe", id],
    queryFn: () => fetchRecipe(id),
  });

  const toggleIngredient = (index: number) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedIngredients(newChecked);
  };

  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" fullHeight={false} />
      </div>
    );
  if (error ?? !recipe) return <div>Failed to load recipe.</div>;

  const ingredients = recipe.ingredients
    .split("\n")
    .filter((line) => line.trim() !== "");
  const instructions = recipe.instructions
    .split("\n")
    .filter((line) => line.trim() !== "");

  return (
    <PageTransition>
      <div className="h-screen w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-border">
          <div className="flex items-center gap-6">
            <AnimatedBackButton className="h-8 w-8 rounded-full bg-transparent hover:bg-accent flex items-center justify-center">
              <ArrowLeft className="h-4 w-4" />
            </AnimatedBackButton>
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">
                {recipe.name}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/edit/${recipe.id}`)}
                className="h-8 w-8 rounded-full"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddToList(true)}
                className="h-8 w-8 rounded-full"
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleFavorite(recipe)}
                className="h-8 w-8 rounded-full"
              >
                <IconHeart
                  size={16}
                  className={cn(
                    "transition-colors duration-300",
                    recipe.favorite
                      ? "text-destructive fill-current"
                      : "text-foreground"
                  )}
                  strokeWidth={2}
                />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(100vh-7rem)]">
          {/* Left Column - Image + Ingredients */}
          <div className="w-[45%] border-r border-border flex flex-col">
            {/* Image */}
            <div className="aspect-[16/9] relative">
              <Image
                src={recipe.imageUrl}
                alt={`Image of ${recipe.name}`}
                fill
                priority
                sizes="45vw"
                className="object-cover"
              />
            </div>

            <div className="flex flex-col min-h-0 flex-1 p-4">
              {recipe.tags && recipe.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {recipe.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Ingredients */}
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-lg font-semibold text-foreground">
                  Ingredients
                </h2>
                <Badge variant="outline">{ingredients.length}</Badge>
              </div>
              <div className="overflow-y-auto min-h-0 flex-1 space-y-2.5">
                {ingredients.map((ingredient, index) => {
                  const key = `ingredient-${index}-${ingredient.trim().toLowerCase().replace(/\s+/g, "-")}`;
                  return (
                    <div key={key} className="flex items-start gap-2">
                      <Checkbox
                        id={key}
                        checked={checkedIngredients.has(index)}
                        onCheckedChange={() => toggleIngredient(index)}
                      />
                      <label
                        htmlFor={key}
                        className={cn(
                          "text-sm leading-relaxed cursor-pointer",
                          checkedIngredients.has(index)
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        )}
                      >
                        {ingredient}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Instructions */}
          <div className="w-[55%]">
            <div className="p-4 h-full overflow-y-auto">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-lg font-semibold text-foreground">
                  Instructions
                </h2>
                <Badge variant="outline">{instructions.length} steps</Badge>
              </div>
              <div className="space-y-4">
                {instructions.map((instruction) => {
                  const key = `instruction-${instruction.trim().toLowerCase().slice(0, 32).replace(/\s+/g, "-")}`;
                  return (
                    <div key={key} className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        {instructions.indexOf(instruction) + 1}
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/90">
                        {instruction}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-14 px-4 border-t border-border flex items-center justify-between">
          {recipe.link && (
            <Button
              variant="ghost"
              className="text-sm h-8"
              onClick={() => window.open(recipe.link, "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              View Original Recipe
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => window.print()}
              className="text-sm h-8"
            >
              Print Recipe
            </Button>
            <Button
              onClick={() => setShowAddToList(true)}
              className="text-sm h-8"
            >
              Add to Shopping List
            </Button>
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
    </PageTransition>
  );
}
