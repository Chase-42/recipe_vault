"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { IconHeart } from "@tabler/icons-react";
import type { Recipe } from "~/types";
import { memo } from "react";

interface RecipeCardProps {
  recipe: Recipe;
  onDelete: (id: number) => void;
  onFavoriteToggle: (id: number, favorite: boolean) => void;
  priority?: boolean;
  onImageLoad?: (id: number) => void;
}

function RecipeCard({
  recipe,
  onDelete,
  onFavoriteToggle,
  priority = false,
  onImageLoad,
}: RecipeCardProps) {
  const handleFavoriteToggle = () => {
    onFavoriteToggle(recipe.id, !recipe.favorite);
  };

  const handleImageLoadComplete = () => {
    onImageLoad?.(recipe.id);
  };

  const shouldPrioritize = priority || recipe.id <= 4;

  return (
    <div className="recipe-card group relative flex max-w-md flex-col items-center rounded-md border-2 border-transparent p-4 text-white shadow-md transition hover:border-white">
      <button
        type="button"
        onClick={handleFavoriteToggle}
        className={`absolute right-2 top-2 z-10 transition-opacity duration-300 group-hover:opacity-100 ${
          recipe.favorite ? "opacity-100" : "opacity-0"
        }`}
        aria-label={recipe.favorite ? "Unfavorite" : "Favorite"}
      >
        <IconHeart
          size={24}
          className={`transition-colors duration-300 ${
            recipe.favorite ? "text-red-500" : "text-white"
          }`}
          strokeWidth={2}
          fill={recipe.favorite ? "currentColor" : "none"}
        />
      </button>

      <div className="flex w-full flex-col items-center">
        <h2 className="mb-2 break-words text-center text-lg font-semibold">
          {recipe.name}
        </h2>
        <Link href={`/img/${recipe.id}`} className="group relative mb-4">
          <Image
            src={recipe.imageUrl}
            className="rounded-md transition-transform duration-300 group-hover:scale-105"
            style={{
              objectFit: "cover",
              transform: "translateZ(0)",
            }}
            width={300}
            height={300}
            alt={recipe.name}
            placeholder="blur"
            blurDataURL={recipe.blurDataUrl}
            priority={shouldPrioritize}
            loading={shouldPrioritize ? undefined : "lazy"}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
            onLoad={handleImageLoadComplete}
            onError={handleImageLoadComplete}
          />
        </Link>

        <div className="flex w-full justify-center gap-3 pt-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Link href={`/edit/${recipe.id}`}>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/10 transition-colors duration-200 hover:bg-white/20"
            >
              Edit
            </Button>
          </Link>
          <Link href={`/print/${recipe.id}`}>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/10 transition-colors duration-200 hover:bg-white/20"
            >
              Print
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/10 transition-colors duration-200 hover:bg-white/20"
              >
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  recipe.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(recipe.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

export default memo(RecipeCard, (prevProps, nextProps) => {
  return (
    prevProps.recipe.id === nextProps.recipe.id &&
    prevProps.recipe.favorite === nextProps.recipe.favorite
  );
});
