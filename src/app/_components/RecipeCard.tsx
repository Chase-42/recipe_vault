"use client";

import dynamic from "next/dynamic";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { memo, useState, useEffect } from "react";
import { IconHeart } from "@tabler/icons-react";
import type { Recipe } from "~/types";

interface RecipeCardProps {
  recipe: Recipe;
  onDelete: (id: number) => void;
  onFavoriteToggle: (id: number, favorite: boolean) => void;
  priority?: boolean;
  onImageLoad?: (id: number) => void;
}

// Preload the motion component for faster subsequent loads
const MotionDiv = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.div),
  {
    ssr: false,
    loading: () => (
      <div className="recipe-card group relative flex max-w-md flex-col items-center rounded-md border-2 border-transparent p-4 text-white shadow-md">
        {/* Minimal loading state that matches final layout */}
      </div>
    ),
  },
);

// Define animation variants outside component to prevent recreating on each render
const cardAnimations = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onDelete,
  onFavoriteToggle,
  priority = false,
  onImageLoad,
}) => {
  const [isFavorite, setIsFavorite] = useState(recipe.favorite);
  // Keep dialog mounted but hidden
  const [isDialogMounted, setIsDialogMounted] = useState(false);

  // Mount dialog immediately on component load
  useEffect(() => {
    setIsDialogMounted(true);
  }, []);

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
    onFavoriteToggle(recipe.id, !isFavorite);
  };

  // Optimize image loading
  const shouldPrioritize = priority || recipe.id <= 4; // Prioritize first 4 images

  const handleImageLoadComplete = () => {
    onImageLoad?.(recipe.id);
  };

  return (
    <MotionDiv
      {...cardAnimations}
      key={recipe.id}
      initial="initial"
      animate="animate"
      exit="exit"
      layoutId={`recipe-${recipe.id}`} // Add layoutId for smoother transitions
      className="recipe-card group relative flex max-w-md flex-col items-center rounded-md border-2 border-transparent p-4 text-white shadow-md transition hover:border-white"
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleFavoriteToggle}
              className={`absolute right-2 top-2 z-10 transition-opacity duration-300 group-hover:opacity-100 ${
                isFavorite ? "opacity-100" : "opacity-0"
              }`}
              aria-label={isFavorite ? "Unfavorite" : "Favorite"}
            >
              <IconHeart
                size={24}
                className={`transition-colors duration-300 ${
                  isFavorite ? "text-red-500" : "text-white"
                }`}
                strokeWidth={2}
                fill={isFavorite ? "currentColor" : "none"}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {isFavorite ? "Remove from favorites" : "Make it a favorite!"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex w-full flex-grow flex-col items-center">
        <h2 className="mb-2 break-words text-center text-lg font-semibold">
          {recipe.name}
        </h2>
        <Link
          prefetch={true}
          href={`/img/${recipe.id}`}
          className="group relative"
        >
          <Image
            src={recipe.imageUrl}
            className="rounded-md"
            style={{ objectFit: "cover" }}
            width={300}
            height={300}
            alt={recipe.name}
            placeholder="blur"
            blurDataURL={recipe.blurDataUrl}
            priority={shouldPrioritize}
            loading={shouldPrioritize ? undefined : "lazy"}
            sizes="(max-width: 768px) 100vw, 300px" // Add sizes for better resource loading
            onLoad={handleImageLoadComplete}
            onError={handleImageLoadComplete}
          />
        </Link>
      </div>
      <div className="mt-2 flex w-full justify-between">
        <Link href={`/edit/${recipe.id}`} prefetch={true}>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 opacity-0 transition-opacity group-hover:opacity-100"
          >
            Edit
          </Button>
        </Link>
        {isDialogMounted && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 opacity-0 transition-opacity group-hover:opacity-100"
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
        )}
      </div>
    </MotionDiv>
  );
};

RecipeCard.displayName = "RecipeCard";

// Use React.memo with custom comparison
export default memo(RecipeCard, (prevProps, nextProps) => {
  return (
    prevProps.recipe.id === nextProps.recipe.id &&
    prevProps.recipe.favorite === nextProps.recipe.favorite
  );
});
