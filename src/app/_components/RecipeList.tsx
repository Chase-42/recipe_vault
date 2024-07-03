"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useSearch } from "../../providers";
import type { Recipe } from "~/types";
import { motion } from "framer-motion";
import LoadingSpinner from "./LoadingSpinner";
import { useEffect, useState } from "react";

interface RecipesClientProps {
  initialRecipes: Recipe[];
}

const fetchRecipes = async (): Promise<Recipe[]> => {
  try {
    const response: Response = await fetch("/api/recipes");
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data: Recipe[] = (await response.json()) as Recipe[];
    return data;
  } catch (error) {
    console.error("Failed to fetch recipes:", error);
    throw error;
  }
};

const RecipesClient: React.FC<RecipesClientProps> = ({ initialRecipes }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/flask/scraper")
      .then((response) => response.json())
      .then((data) => setData(data));
  }, []);
  const { searchTerm } = useSearch();

  const {
    data: recipes = initialRecipes,
    error,
    isLoading,
  } = useQuery<Recipe[]>({
    queryKey: ["recipes"],
    queryFn: fetchRecipes,
    initialData: initialRecipes,
  });

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-xl text-red-800">Error loading recipes</div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-4 p-4">
      {data ? <p>{data.message}</p> : <p>Loading...</p>}
      {filteredRecipes.map((recipe) => (
        <motion.div
          key={recipe.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="recipe-card group flex max-w-xs flex-col items-center rounded-md border-2 border-transparent p-4 text-white shadow-md transition hover:border-white"
        >
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
        </motion.div>
      ))}
    </div>
  );
};

export default RecipesClient;
