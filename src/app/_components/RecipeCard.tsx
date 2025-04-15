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
    <div className="recipe-card group relative flex max-w-md flex-col items-center rounded-md border-2 border-transparent p-4 text-white shadow-md transition hover:border-white">
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
        <h2 className="mb-2 break-words text-center text-lg font-semibold">
          {recipe.name}
        </h2>
        <Link
          href={`/img/${recipe.id}?modal=true`}
          onClick={handleCardClick}
          className="group relative mb-4 w-full"
          prefetch={false}
        >
          <div className="relative aspect-square w-full overflow-hidden rounded-md">
            <Image
              ref={imageRef}
              src={recipe.imageUrl}
              className={cn(
                "h-full w-full object-cover transition-all duration-300",
                !isImageLoaded && "blur-sm",
                "group-hover:scale-105 group-active:scale-100",
              )}
              style={{
                transform: "translateZ(0)",
                willChange: "transform",
              }}
              width={400}
              height={400}
              alt={recipe.name}
              placeholder="blur"
              blurDataURL={recipe.blurDataUrl}
              priority={shouldPrioritize}
              loading={shouldPrioritize ? "eager" : "lazy"}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
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

        <div className="flex w-full justify-center gap-3 pt-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Link href={`/edit/${recipe.id}`} prefetch={false}>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/10 transition-colors duration-200 hover:bg-white/20"
            >
              Edit
            </Button>
          </Link>
          <Link href={`/print/${recipe.id}`} prefetch={false}>
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
    prevProps.recipe.favorite === nextProps.recipe.favorite &&
    prevProps.priority === nextProps.priority
  );
});
