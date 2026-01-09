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
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  initialRecipe?: Recipe | null;
  loadingFallback?: React.ReactNode;
}

export default function FullImageView({
  id,
  initialRecipe,
  loadingFallback,
}: FullPageImageViewProps) {
  const router = useRouter();
  const [showAddToList, setShowAddToList] = useState(false);
  const { toggleFavorite } = useFavoriteToggle();
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(
    new Set()
  );
  const queryClient = useQueryClient();
  const cachedData = queryClient.getQueryData<Recipe>(["recipe", id]);
  const hasCachedData = !!cachedData;

  const { data: recipe, error, isLoading } = useQuery<Recipe>({
    queryKey: ["recipe", id],
    queryFn: () => fetchRecipe(id),
    initialData: cachedData ?? initialRecipe ?? undefined,
    placeholderData: cachedData ?? initialRecipe ?? undefined,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: !hasCachedData,
    refetchOnWindowFocus: false,
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

  const displayRecipe = recipe ?? cachedData ?? initialRecipe;
  
  if (isLoading && !displayRecipe) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" fullHeight={false} />
      </div>
    );
  }
  if (error && !displayRecipe) return <div>Failed to load recipe.</div>;
  if (!displayRecipe) return <div>Recipe not found.</div>;

  const ingredients = displayRecipe.ingredients
    .split("\n")
    .filter((line) => line.trim() !== "");
  const instructions = displayRecipe.instructions
    .split("\n")
    .filter((line) => line.trim() !== "");

  return (
    <PageTransition>
      <div className="h-screen w-full">
        <div className="flex items-center justify-between px-4 h-14 border-b border-border">
          <div className="flex items-center gap-6">
            <AnimatedBackButton className="h-8 w-8 rounded-full bg-transparent hover:bg-accent flex items-center justify-center">
              <ArrowLeft className="h-4 w-4" />
            </AnimatedBackButton>
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">
                {displayRecipe.name}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/edit/${displayRecipe.id}`)}
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
                onClick={() => toggleFavorite(displayRecipe)}
                className="h-8 w-8 rounded-full"
              >
                <IconHeart
                  size={16}
                  className={cn(
                    "transition-colors duration-300",
                    displayRecipe.favorite
                      ? "text-destructive fill-current"
                      : "text-foreground"
                  )}
                  strokeWidth={2}
                />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-7rem)]">
          <div className="w-[45%] border-r border-border flex flex-col">
            <div className="aspect-[16/9] relative">
              <Image
                src={displayRecipe.imageUrl}
                alt={`Image of ${displayRecipe.name}`}
                fill
                priority
                sizes="45vw"
                className="object-cover"
              />
            </div>

            <div className="flex flex-col min-h-0 flex-1 p-4">
              {displayRecipe.tags && displayRecipe.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {displayRecipe.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

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

          <div className="w-[55%]">
            <div className="p-4 h-full overflow-y-auto">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-lg font-semibold text-foreground">
                  Instructions
                </h2>
                <Badge variant="outline">{instructions.length} steps</Badge>
              </div>
              <div className="space-y-4">
                {instructions.map((instruction, index) => {
                  const key = `instruction-${index}-${instruction.trim().toLowerCase().slice(0, 32).replace(/\s+/g, "-")}`;
                  return (
                    <div key={key} className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
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

        <div className="h-14 px-4 border-t border-border flex items-center justify-between">
          {displayRecipe.link && (
            <Button
              variant="ghost"
              className="text-sm h-8"
              onClick={() => window.open(displayRecipe.link, "_blank")}
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
          recipeId={displayRecipe.id}
          recipeName={displayRecipe.name}
        />
      </div>
    </PageTransition>
  );
}
