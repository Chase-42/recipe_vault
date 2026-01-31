"use client";

import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import type { PaginatedRecipes } from "~/types";
import { recipesKey } from "~/utils/query-keys";
import RecipeListContainer from "./RecipeListContainer";

interface RecipeListProps {
  initialData?: PaginatedRecipes;
}

export default function RecipeList({ initialData }: RecipeListProps) {
  if (initialData) {
    const queryClient = new QueryClient();

    queryClient.setQueryData(
      recipesKey({ searchTerm: "", sortOption: "newest", category: "All", page: 1 }),
      initialData
    );

    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <RecipeListContainer />
      </HydrationBoundary>
    );
  }

  return <RecipeListContainer />;
}
