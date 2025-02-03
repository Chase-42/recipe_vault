"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "~/providers";
import type { Recipe, PaginatedResponse } from "~/types";
import { useMemo, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Fuse from "fuse.js";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "~/components/ui/button";
import { LayoutGrid, LayoutList } from "lucide-react";
import { cn } from "~/lib/utils";

// Components
import RecipeCard from "./RecipeCard";
import LoadingSpinner from "./LoadingSpinner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";

// Utils
import { deleteRecipe, fetchRecipe, fetchRecipes } from "~/utils/recipeService";
import { useFavoriteToggle } from "~/hooks/useFavoriteToggle";

// Constants & Types
const ITEMS_PER_PAGE = 12;
const FUSE_OPTIONS = {
  keys: ["name"],
  threshold: 0.5,
};

type SortOption = "favorite" | "newest" | "oldest";

const RecipesClient = () => {
  // Hooks
  const { searchTerm } = useSearch();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toggleFavorite } = useFavoriteToggle();

  // State
  const [showPagination, setShowPagination] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>(
    {},
  );
  const [gridView, setGridView] = useState<"grid" | "list">("grid");

  // URL params
  const currentPage = Number(searchParams.get("page")) || 1;
  const sortOption = (searchParams.get("sort") as SortOption) || "newest";
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Data fetching
  const { data, error, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["recipes", offset],
    queryFn: () => fetchRecipes(offset, ITEMS_PER_PAGE),
    staleTime: 30000,
  });

  const recipes = useMemo(() => data?.recipes ?? [], [data?.recipes]);
  const totalPages = data?.pagination?.totalPages ?? 0;
  const total = data?.pagination?.total ?? 0;

  // Filtering and sorting
  const filteredAndSortedRecipes = useMemo(() => {
    let result = [...recipes];

    if (searchTerm) {
      const fuse = new Fuse(result, FUSE_OPTIONS);
      result = fuse.search(searchTerm).map(({ item }) => item);
    }

    switch (sortOption) {
      case "favorite":
        result.sort((a, b) => {
          if (a.favorite === b.favorite) {
            // If favorites are equal, maintain the original order based on creation date
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          }
          return a.favorite ? -1 : 1;
        });
        break;
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
    }

    return result;
  }, [recipes, searchTerm, sortOption]);

  // Image loading handling
  const handleImageLoad = useCallback((recipeId: number) => {
    setLoadingStates((prev) => ({ ...prev, [recipeId]: true }));
  }, []);

  useEffect(() => {
    const allImagesProcessed = filteredAndSortedRecipes.every(
      (recipe) => loadingStates[recipe.id],
    );
    if (allImagesProcessed) {
      setShowPagination(true);
    }
  }, [loadingStates, filteredAndSortedRecipes]);

  useEffect(() => {
    setLoadingStates({});
    setShowPagination(false);
  }, [recipes]);

  // Event handlers
  const handleRecipeHover = useCallback(
    async (recipe: Recipe) => {
      router.prefetch(`/img/${recipe.id}`);
      router.prefetch(`/edit/${recipe.id}`);
      await queryClient.prefetchQuery({
        queryKey: ["recipe", recipe.id],
        queryFn: () => fetchRecipe(recipe.id),
      });
    },
    [queryClient, router],
  );

  const handleFavoriteToggle = useCallback(
    async (id: number, favorite: boolean) => {
      const recipe = recipes.find((r) => r.id === id);
      if (!recipe) {
        toast.error("Recipe not found");
        return;
      }
      await toggleFavorite(recipe);
    },
    [recipes, toggleFavorite],
  );

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteRecipe(id);
        await queryClient.invalidateQueries({ queryKey: ["recipes"] });
        toast.success("Recipe deleted successfully");
      } catch (error) {
        toast.error("Failed to delete recipe");
      }
    },
    [queryClient],
  );

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const query = createQueryString("page", page.toString());
      router.push(`${pathname}?${query}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [createQueryString, pathname, router],
  );

  const handleSortChange = useCallback(
    (value: SortOption) => {
      const query = createQueryString("sort", value);
      router.push(`${pathname}?${query}`);
    },
    [createQueryString, pathname, router],
  );

  // Error and loading states
  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-xl text-red-800">
        Error loading recipes
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-4">
      <motion.div
        className="mb-4 flex items-center justify-between gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {total > 0 && (
              <span>
                Showing {offset + 1}-{Math.min(offset + ITEMS_PER_PAGE, total)}{" "}
                of {total} recipes
              </span>
            )}
          </div>
          <div className="flex items-center rounded-lg border bg-background">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setGridView("grid")}
              className={cn(
                "hover:bg-accent hover:text-accent-foreground",
                gridView === "grid" && "bg-accent text-accent-foreground",
                "border-r",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setGridView("list")}
              className={cn(
                "hover:bg-accent hover:text-accent-foreground",
                gridView === "list" && "bg-accent text-accent-foreground",
              )}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Select value={sortOption} onValueChange={handleSortChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sort Recipes By:</SelectLabel>
              <SelectItem value="favorite">Favorite</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </motion.div>

      <div
        className={cn(
          "flex flex-wrap gap-4",
          gridView === "grid"
            ? "justify-center"
            : "mx-auto w-full max-w-3xl flex-col items-center",
        )}
      >
        {filteredAndSortedRecipes.map((recipe) => (
          <div key={recipe.id} onMouseEnter={() => handleRecipeHover(recipe)}>
            <RecipeCard
              recipe={recipe}
              onDelete={handleDelete}
              onFavoriteToggle={handleFavoriteToggle}
              priority={currentPage === 1 && recipe.id <= 4}
              onImageLoad={handleImageLoad}
            />
          </div>
        ))}
      </div>

      {totalPages > 1 && showPagination && (
        <div className="mt-8 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) handlePageChange(currentPage - 1);
                  }}
                  className={
                    currentPage <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(page);
                      }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages)
                      handlePageChange(currentPage + 1);
                  }}
                  className={
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default RecipesClient;
