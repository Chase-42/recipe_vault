"use client";

import { LayoutGrid, LayoutList } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { type Category, MAIN_MEAL_CATEGORIES } from "~/types/category";

type SortOption = "favorite" | "newest" | "oldest";

interface RecipeFiltersProps {
  total: number;
  offset: number;
  itemsPerPage: number;
  gridView: "grid" | "list";
  setGridView: (view: "grid" | "list") => void;
  selectedCategory: Category;
  setSelectedCategory: (category: Category) => void;
  sortOption: SortOption;
  onSortChange: (value: SortOption) => void;
}

export default function RecipeFilters({
  total,
  offset,
  itemsPerPage,
  gridView,
  setGridView,
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
        <div className="flex items-center rounded-lg border bg-background">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setGridView("grid")}
            className={cn(
              "hover:bg-accent hover:text-accent-foreground",
              gridView === "grid" && "bg-accent text-accent-foreground",
              "border-r p-2 sm:p-3"
            )}
          >
            <LayoutGrid className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setGridView("list")}
            className={cn(
              "p-2 hover:bg-accent hover:text-accent-foreground sm:p-3",
              gridView === "list" && "bg-accent text-accent-foreground"
            )}
          >
            <LayoutList className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
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
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
