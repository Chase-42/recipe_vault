"use client";

import Image from "next/image";
import { Button } from "~/components/ui/button";
import { IconHeart } from "@tabler/icons-react";
import type { Recipe } from "~/types";
import { memo, useState, useCallback, useEffect, useRef } from "react";
import { cn } from "~/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

interface RecipeCardProps {
  recipe: Recipe;
  onDelete: (id: number) => void;
  onFavoriteToggle: (id: number) => void;
  priority?: boolean;
}

function RecipeCard({
  recipe,
  onDelete,
  onFavoriteToggle,
  priority = false,
}: RecipeCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const router = useRouter();
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFavoriteToggle = useCallback(() => {
    onFavoriteToggle(recipe.id);
  }, [recipe.id, onFavoriteToggle]);

  const handleImageLoadComplete = useCallback(() => {
    setIsImageLoaded(true);
  }, []);

  // Check if image is already cached on mount
  useEffect(() => {
    if (imageRef.current?.complete) {
      handleImageLoadComplete();
    }
  }, [handleImageLoadComplete]);

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      router.push(`/img/${recipe.id}?modal=true`);
    },
    [recipe.id, router],
  );

  const shouldPrioritize = priority || recipe.id <= 4;

  return (
    <div className="recipe-card group relative flex max-w-md flex-col items-center rounded-md border-2 border-transparent p-3 text-white shadow-md transition hover:border-white sm:p-4">
      {recipe.favorite ? (
        <button
          type="button"
          onClick={handleFavoriteToggle}
          className="absolute right-2 top-2 z-10 transition-opacity duration-300 group-hover:opacity-100"
          aria-label="Unfavorite"
        >
          <IconHeart
            size={24}
            className="text-red-500 transition-colors duration-300"
            strokeWidth={2}
            fill="currentColor"
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleFavoriteToggle}
          className="absolute right-2 top-2 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-label="Favorite"
        >
          <IconHeart
            size={24}
            className="text-white transition-colors duration-300"
            strokeWidth={2}
          />
        </button>
      )}

      <div className="flex w-full flex-col items-center">
        <h2 className="mb-2 break-words text-center text-base font-semibold sm:text-lg">
          {recipe.name}
        </h2>
        <Link
          href={`/img/${recipe.id}?modal=true`}
          onClick={handleCardClick}
          className="group relative mb-3 sm:mb-4"
          prefetch={false}
        >
          <div className="relative">
            <Image
              ref={imageRef}
              src={recipe.imageUrl}
              className={cn(
                "rounded-md transition-all duration-300",
                !isImageLoaded && "blur-sm",
                "group-hover:scale-105",
              )}
              style={{
                objectFit: "cover",
                transform: "translateZ(0)",
                willChange: "transform",
              }}
              width={300}
              height={300}
              alt={recipe.name}
              placeholder="blur"
              blurDataURL={recipe.blurDataUrl}
              priority={shouldPrioritize}
              loading={shouldPrioritize ? "eager" : "lazy"}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
              onLoad={handleImageLoadComplete}
              onError={handleImageLoadComplete}
              quality={75}
              fetchPriority={shouldPrioritize ? "high" : "auto"}
            />
            {!isImageLoaded && (
              <div
                className="absolute inset-0 bg-gray-700/20 blur-sm"
                aria-hidden="true"
              />
            )}
          </div>
        </Link>

        <div className="flex w-full justify-center gap-2 pt-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:gap-3">
          <Link
            href={`/edit/${recipe.id}`}
            prefetch={false}
            className="flex-1 sm:flex-none"
          >
            <Button
              variant="secondary"
              size="sm"
              className="w-full bg-white/10 transition-colors duration-200 hover:bg-white/20 sm:w-auto"
            >
              Edit
            </Button>
          </Link>
          <Link
            href={`/print/${recipe.id}`}
            prefetch={false}
            className="flex-1 sm:flex-none"
          >
            <Button
              variant="secondary"
              size="sm"
              className="w-full bg-white/10 transition-colors duration-200 hover:bg-white/20 sm:w-auto"
            >
              Print
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="w-full bg-white/10 transition-colors duration-200 hover:bg-white/20 sm:w-auto"
              >
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-[425px]">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm sm:text-base">
                  This action cannot be undone. This will permanently delete the
                  recipe.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
                <AlertDialogCancel className="w-full sm:w-auto">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(recipe.id)}
                  className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
                >
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
    prevProps.recipe.favorite === nextProps.recipe.favorite &&
    prevProps.priority === nextProps.priority
  );
});
