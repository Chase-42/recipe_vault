"use client";

import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";
import type { Category } from "~/types";
import { MAIN_MEAL_CATEGORIES } from "~/types";
import type { SortOption } from "~/types";

interface RecipeFiltersProps {
  total: number;
  offset: number;
  itemsPerPage: number;
  selectedCategory: Category;
  setSelectedCategory: (category: Category) => void;
  sortOption: SortOption;
  onSortChange: (value: SortOption) => void;
}

export default function RecipeFilters({
  total,
  offset,
  itemsPerPage,
  selectedCategory,
  setSelectedCategory,
  sortOption,
  onSortChange,
}: RecipeFiltersProps) {
  return (
    <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          {total > 0 && (
            <span>
              Showing {offset + 1}-{Math.min(offset + itemsPerPage, total)} of{" "}
              {total} recipes
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={selectedCategory}
          onValueChange={(value: Category) => setSelectedCategory(value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {MAIN_MEAL_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortOption} onValueChange={onSortChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="favorite">Favorites First</SelectItem>
            <SelectItem value="relevance">Relevance</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
