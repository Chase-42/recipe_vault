"use client";

import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import type { PaginatedRecipes } from "~/types";
import RecipeListContainer from "./RecipeListContainer";

interface RecipeListProps {
  initialData?: PaginatedRecipes;
}

export default function RecipeList({ initialData }: RecipeListProps) {
  // If we have initial data, hydrate it into the query client
  if (initialData) {
    const queryClient = new QueryClient();

    queryClient.setQueryData(
      [
        "recipes",
        { searchTerm: "", sortOption: "newest", category: "all", page: 1 },
      ],
      initialData
    );

    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <RecipeListContainer />
      </HydrationBoundary>
    );
  }

  // No initial data, just render normally
  return <RecipeListContainer />;
}
