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
import type { Recipe } from "~/types";

interface RecipeCardProps {
  recipe: Recipe;
  onDelete: (id: number) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onDelete }) => (
  <motion.div
    key={recipe.id}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="recipe-card group relative flex max-w-xs flex-col items-center rounded-md border-2 border-transparent p-4 text-white shadow-md transition hover:border-white"
  >
    <div className="flex w-full flex-grow flex-col items-center">
      <h2 className="text-md mb-2 break-words text-center font-semibold">
        {recipe.name}
      </h2>
      <Link href={`/img/${recipe.id}`} className="group relative">
        <Image
          src={recipe.imageUrl}
          className="rounded-md"
          style={{ objectFit: "cover" }}
          width={192}
          height={192}
          alt={`Image of ${recipe.name}`}
          placeholder="blur"
          blurDataURL={recipe.blurDataUrl}
        />
      </Link>
    </div>
    <div className="mt-2 hidden w-full justify-between group-hover:flex">
      <Button
        variant="ghost"
        size="sm"
        className="p-2"
        onClick={() => alert("Edit action")}
      >
        Edit
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
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
  </motion.div>
);

RecipeCard.displayName = "RecipeCard";

export default RecipeCard;
