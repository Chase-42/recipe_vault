"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Checkbox } from "~/components/ui/checkbox";
import { fetchRecipe, updateRecipe } from "~/utils/recipeService";
import type { Recipe } from "~/types";
import { Category, MAIN_MEAL_CATEGORIES } from "~/types/category";
import LoadingSpinner from "./LoadingSpinner";
import { useFavoriteToggle } from "~/hooks/useFavoriteToggle";
import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "~/components/ui/button";
import { AddToListModal } from "~/components/shopping-lists/AddToListModal";
import { ShoppingCart, Pencil, Heart, Edit, ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { IconHeart } from "@tabler/icons-react";
import { cn } from "~/lib/utils";
import { useRouter } from "next/navigation";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";

interface FullImagePageProps {
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

export default function FullImagePage({ id }: FullImagePageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [imageLoading, setImageLoading] = useState(true);
  const [showAddToList, setShowAddToList] = useState(false);

  // Get cached recipe data immediately
  const cachedRecipe = queryClient.getQueryData<Recipe>(["recipe", id]);

  const { data: recipe } = useQuery<Recipe>({
    queryKey: ["recipe", id],
    queryFn: async () => {
      const data = await fetchRecipe(id);
      return data;
    },
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
  if (!recipe) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Error</h2>
          <p className="text-gray-500">Failed to load recipe</p>
        </div>
      </div>
    );
  }

  // Debug log for recipe object
  console.log("FullImagePage recipe:", recipe);

  const ingredients = recipe.ingredients.split("\n");
  const instructions = recipe.instructions.split("\n");

  const toggleFavoriteHandler = async (recipe: Recipe) => {
    try {
      await updateRecipe({
        ...recipe,
        favorite: !recipe.favorite,
      });
      toast.success(
        recipe.favorite ? "Removed from favorites" : "Added to favorites",
      );
    } catch (error) {
      toast.error("Failed to update favorite status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-lg font-bold">{recipe.name}</div>
        <div className="flex space-x-2">
          {recipe.categories && (
            <div className="flex space-x-2">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                {recipe.categories}
              </span>
            </div>
          )}
          {recipe.tags && (
            <div className="flex space-x-2">
              {recipe.tags
                .split(",")
                .filter(Boolean)
                .map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm"
                  >
                    {tag.trim()}
                  </span>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push(`/edit/${recipe.id}`)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => toggleFavoriteHandler(recipe)}
        >
          <Heart
            className={`h-4 w-4 ${recipe.favorite && "text-red-500"}`}
            fill={recipe.favorite ? "currentColor" : "none"}
          />
        </Button>
        {recipe.favorite && (
          <span className="text-sm text-gray-500">
            {recipe.favorite ? "Favorite" : ""}
          </span>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-4 text-lg font-semibold">Ingredients</h3>
          <ul className="space-y-2">
            {ingredients.map((ingredient: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{ingredient.trim()}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold">Instructions</h3>
          <ol className="space-y-4">
            {instructions.map((instruction: string, index: number) => (
              <li key={index} className="flex">
                <span className="mr-2 font-bold">{index + 1}.</span>
                <span>{instruction.trim()}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {recipe.link ? (
        <div className="mt-6">
          <a
            href={recipe.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-500 hover:underline"
          >
            View Original Recipe
            <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        </div>
      ) : null}

      {recipe.imageUrl ? (
        <div className="mt-6">
          <img src={recipe.imageUrl} alt={recipe.name} className="rounded-lg" />
        </div>
      ) : null}

      <div className="mt-6">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
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
