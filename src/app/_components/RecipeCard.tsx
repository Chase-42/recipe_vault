"use client";

import { IconHeart } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Button } from "~/components/ui/button";
import type { Recipe, RecipeSearchMatch } from "~/types";
import { useSearch } from "~/providers";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { fetchRecipe } from "~/utils/recipeService";
import { recipeKey } from "~/utils/query-keys";

interface RecipeCardProps {
  recipe: Recipe;
  searchMatches?: RecipeSearchMatch[];
  onDelete: (id: number) => void;
  onFavoriteToggle: (id: number) => void;
  priority?: boolean;
}

function RecipeCard({
  recipe,
  searchMatches,
  onDelete,
  onFavoriteToggle,
  priority = false,
}: RecipeCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const prefetchedRef = useRef(false);
  const imagePreloadedRef = useRef(false);
  const { searchTerm } = useSearch();

  const handleFavoriteToggle = useCallback(() => {
    onFavoriteToggle(recipe.id);
  }, [recipe.id, onFavoriteToggle]);

  const handleImageLoadComplete = useCallback(() => {
    setIsImageLoaded(true);
  }, []);

  useEffect(() => {
    if (imageRef.current?.complete) {
      handleImageLoadComplete();
    }
  }, [handleImageLoadComplete]);

  const doPrefetch = useCallback(() => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;

    void router.prefetch(`/img/${recipe.id}`);
    void router.prefetch(`/edit/${recipe.id}`);
    void router.prefetch(`/print/${recipe.id}`);

    const cacheKey = recipeKey(recipe.id);
    if (!queryClient.getQueryData(cacheKey)) {
      void queryClient.prefetchQuery({
        queryKey: cacheKey,
        queryFn: () => fetchRecipe(recipe.id),
        gcTime: 1000 * 60 * 30,
      });
    }
  }, [recipe.id, router, queryClient]);

  // Prefetch when card enters viewport
  useEffect(() => {
    const card = cardRef.current;
    if (!card || prefetchedRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          doPrefetch();
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, [doPrefetch]);

  const handlePointerEnter = useCallback(() => {
    doPrefetch();
    if (imagePreloadedRef.current) return;
    imagePreloadedRef.current = true;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = recipe.imageUrl;
    document.head.appendChild(link);
  }, [doPrefetch, recipe.imageUrl]);

  const highlightMatches = useCallback(
    (text: string, matches?: Array<[number, number]>) => {
      if (!matches || !searchTerm) return text;

      const result = [];
      let lastIndex = 0;

      for (const [start, end] of matches) {
        if (start > lastIndex) {
          result.push(text.slice(lastIndex, start));
        }
        result.push(
          <span key={start} className="bg-yellow-500/30">
            {text.slice(start, end + 1)}
          </span>
        );
        lastIndex = end + 1;
      }

      if (lastIndex < text.length) {
        result.push(text.slice(lastIndex));
      }

      return result;
    },
    [searchTerm]
  );

  const nameMatches = useMemo(
    () => searchMatches?.find((m) => m.key === "name")?.indices,
    [searchMatches]
  );
  const categoryMatches = useMemo(
    () => searchMatches?.find((m) => m.key === "categories")?.indices,
    [searchMatches]
  );
  const tagMatches = useMemo(
    () => searchMatches?.find((m) => m.key === "tags")?.indices,
    [searchMatches]
  );

  const imageLoadingState = useMemo(
    () => ({
      className: cn(
        "h-full w-full object-cover transition-all duration-300",
        !isImageLoaded && "blur-sm",
        "group-hover:scale-105 group-active:scale-100"
      ),
      style: {
        transform: "translateZ(0)",
        willChange: "transform",
      },
    }),
    [isImageLoaded]
  );

  return (
    <div
      ref={cardRef}
      className="recipe-card group relative flex max-w-md flex-col items-center rounded-md p-4 text-white shadow-md overflow-hidden"
      onPointerEnter={handlePointerEnter}
    >
      <svg
        className="absolute inset-0 w-full h-full rounded-md pointer-events-none"
        fill="none"
        aria-hidden="true"
      >
        <title>Decorative card border</title>
        <rect
          className="animated-border"
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          rx="6"
          stroke="white"
          strokeWidth="2"
        />
      </svg>
      <button
        type="button"
        onClick={handleFavoriteToggle}
        className={cn(
          "absolute right-0 top-0 z-20 p-2 transition-opacity duration-300 group-hover:opacity-100",
          !recipe.favorite && "opacity-0"
        )}
        aria-label={recipe.favorite ? "Unfavorite" : "Favorite"}
      >
        <IconHeart
          size={24}
          className={cn(
            "transition-colors duration-300",
            recipe.favorite
              ? "text-[hsl(var(--recipe-red))]"
              : "text-white"
          )}
          strokeWidth={2}
          fill={recipe.favorite ? "currentColor" : "none"}
        />
      </button>
      <div className="relative z-10 w-full">

      <div className="flex w-full flex-col items-center">
        <h2 className="mb-2 break-words text-center text-lg font-semibold">
          {highlightMatches(recipe.name, nameMatches)}
        </h2>
        {(recipe.categories ?? recipe.tags) && (
          <div className="mb-2 flex flex-wrap gap-2">
            {recipe.categories?.map((cat) => (
              <Badge
                key={cat}
                variant="secondary"
                className={cn(categoryMatches && "bg-yellow-500/30")}
              >
                {cat}
              </Badge>
            ))}
            {recipe.tags?.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={cn(tagMatches && "bg-yellow-500/30")}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <Link
          href={`/img/${recipe.id}`}
          className="group relative mb-4 w-full"
        >
          <div className="relative aspect-square w-full overflow-hidden rounded-md">
            <Image
              ref={imageRef}
              src={recipe.imageUrl}
              className={imageLoadingState.className}
              style={imageLoadingState.style}
              width={400}
              height={400}
              alt={recipe.name}
              placeholder="blur"
              blurDataURL={recipe.blurDataUrl}
              priority={priority}
              loading={priority ? "eager" : "lazy"}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
              onLoad={handleImageLoadComplete}
              onError={handleImageLoadComplete}
              quality={75}
              fetchPriority={priority ? "high" : "auto"}
            />
            {!isImageLoaded && (
              <div
                className="absolute inset-0 bg-gray-700/20 blur-sm"
                aria-hidden="true"
              />
            )}
          </div>
        </Link>

        <div className="flex w-full justify-center gap-3 pt-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
          <Link href={`/edit/${recipe.id}`} aria-label={`Edit recipe: ${recipe.name}`}>
            <Button
              variant="secondary"
              size="sm"
              className="bg-gray-700 text-white border border-gray-500 backdrop-blur-sm transition-all duration-200 hover:bg-gray-600 hover:border-gray-400 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black shadow-lg font-medium"
            >
              Edit
            </Button>
          </Link>
          <Link href={`/print/${recipe.id}`} aria-label={`Print recipe: ${recipe.name}`}>
            <Button
              variant="secondary"
              size="sm"
              className="bg-gray-700 text-white border border-gray-500 backdrop-blur-sm transition-all duration-200 hover:bg-gray-600 hover:border-gray-400 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black shadow-lg font-medium"
            >
              Print
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="bg-red-600 text-white border border-red-500 backdrop-blur-sm transition-all duration-200 hover:bg-red-700 hover:border-red-400 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black shadow-lg font-medium"
                aria-label={`Delete recipe: ${recipe.name}`}
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
    </div>
  );
}

function searchMatchesEqual(
  a: RecipeSearchMatch[] | undefined,
  b: RecipeSearchMatch[] | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i]?.key !== b[i]?.key) return false;
    const aIndices = a[i]?.indices;
    const bIndices = b[i]?.indices;
    if (aIndices?.length !== bIndices?.length) return false;
    if (aIndices && bIndices) {
      for (let j = 0; j < aIndices.length; j++) {
        if (
          aIndices[j]?.[0] !== bIndices[j]?.[0] ||
          aIndices[j]?.[1] !== bIndices[j]?.[1]
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

export default memo(RecipeCard, (prevProps, nextProps) => {
  if (prevProps.recipe.id !== nextProps.recipe.id) return false;
  if (prevProps.recipe.favorite !== nextProps.recipe.favorite) return false;
  if (prevProps.priority !== nextProps.priority) return false;
  if (prevProps.onDelete !== nextProps.onDelete) return false;
  if (prevProps.onFavoriteToggle !== nextProps.onFavoriteToggle) return false;

  return searchMatchesEqual(prevProps.searchMatches, nextProps.searchMatches);
});
