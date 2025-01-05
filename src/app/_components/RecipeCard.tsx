"use client";

import { motion } from "framer-motion";
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
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onDelete,
  onFavoriteToggle,
  priority = false,
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      key={recipe.id}
      className="recipe-card group relative flex max-w-md flex-col items-center rounded-md border-2 border-transparent p-4 text-white shadow-md transition hover:border-white"
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
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
            priority={priority}
            loading={priority ? undefined : "lazy"}
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
    </motion.div>
  );
};

RecipeCard.displayName = "RecipeCard";

export default memo(RecipeCard);
