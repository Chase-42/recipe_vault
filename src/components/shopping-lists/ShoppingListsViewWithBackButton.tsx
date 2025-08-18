"use client";

import {
  ArrowLeft,
  Search,
  Trash2,
  ChefHat,
  Filter,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  PageTransition,
  AnimatedBackButton,
} from "~/components/ui/page-transition";
import { useEffect, useMemo, useState } from "react";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
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
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Badge } from "~/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { RecipeError } from "~/lib/errors";
import { logger } from "~/lib/logger";
import type { ShoppingItem } from "~/types";

type FilterType = "all" | "meal-plan" | "manual";

export function ShoppingListsViewWithBackButton() {
  const router = useRouter();
  const [items, setItems] = useState<ShoppingItem[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredItems = useMemo(() => {
    if (!items) return [];

    let filtered = items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply filter type
    if (filterType === "meal-plan") {
      filtered = filtered.filter((item) => item.fromMealPlan);
    } else if (filterType === "manual") {
      filtered = filtered.filter((item) => !item.fromMealPlan);
    }

    return filtered;
  }, [items, searchQuery, filterType]);

  const mealPlanItemsCount = useMemo(() => {
    if (!items) return 0;
    return items.filter((item) => item.fromMealPlan).length;
  }, [items]);

  const manualItemsCount = useMemo(() => {
    if (!items) return 0;
    return items.filter((item) => !item.fromMealPlan).length;
  }, [items]);

  const areAllFilteredItemsChecked = useMemo(
    () =>
      filteredItems.length > 0 && filteredItems.every((item) => item.checked),
    [filteredItems]
  );

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("/api/shopping-lists");
        if (!response.ok) {
          throw new RecipeError("Failed to fetch items", 500);
        }
        const data = (await response.json()) as ShoppingItem[];
        setItems(data);
      } catch (error) {
        logger.error(
          "Error fetching shopping list items",
          error instanceof Error ? error : new Error(String(error)),
          {
            component: "ShoppingListsViewWithBackButton",
            action: "fetchItems",
          }
        );
        setItems([]); // Set empty array on error
      }
    };

    void fetchItems();
  }, []);

  // Show loading spinner while items is null
  if (items === null) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8 rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-semibold">Shopping Lists</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/meal-planner">
                  <Calendar className="h-4 w-4 mr-2" />
                  Meal Planner
                </a>
              </Button>
            </div>
          </div>
        </div>
        <div className="flex h-[calc(100vh-200px)] items-center justify-center rounded-md border p-4">
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }

  const toggleItem = async (itemId: number, checked: boolean) => {
    try {
      const response = await fetch(`/api/shopping-lists/items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ checked }),
      });

      if (!response.ok) {
        throw new RecipeError("Failed to update item", 500);
      }

      // Update local state
      setItems((prev) => {
        if (!prev) return prev;
        return prev.map((item) =>
          item.id === itemId ? { ...item, checked } : item
        );
      });
    } catch (error) {
      logger.error(
        "Error updating shopping list item",
        error instanceof Error ? error : new Error(String(error)),
        {
          component: "ShoppingListsViewWithBackButton",
          action: "toggleItem",
          itemId,
          checked,
        }
      );
    }
  };

  const deleteItem = async (itemId: number) => {
    try {
      const response = await fetch(`/api/shopping-lists/items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new RecipeError("Failed to delete item", 500);
      }

      // Update local state
      setItems((prev) => {
        if (!prev) return prev;
        return prev.filter((item) => item.id !== itemId);
      });
    } catch (error) {
      logger.error(
        "Error deleting shopping list item",
        error instanceof Error ? error : new Error(String(error)),
        {
          component: "ShoppingListsViewWithBackButton",
          action: "deleteItem",
          itemId,
        }
      );
    }
  };

  const deleteAllItems = async () => {
    setIsDeleting(true);
    try {
      const itemsToDelete = filteredItems;
      for (const item of itemsToDelete) {
        await deleteItem(item.id);
      }
    } catch (error) {
      logger.error(
        "Error deleting all shopping list items",
        error instanceof Error ? error : new Error(String(error)),
        {
          component: "ShoppingListsViewWithBackButton",
          action: "deleteAllItems",
          itemCount: filteredItems.length,
        }
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    const newCheckedState = !areAllFilteredItemsChecked;

    // Update local state optimistically
    setItems((prev) => {
      if (!prev) return prev;
      const updatedItems = [...prev];
      for (const item of filteredItems) {
        const index = updatedItems.findIndex((i) => i.id === item.id);
        if (index !== -1) {
          updatedItems[index] = { ...item, checked: newCheckedState };
        }
      }
      return updatedItems;
    });

    // Update server
    void Promise.all(
      filteredItems.map((item) =>
        fetch(`/api/shopping-lists/items/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checked: newCheckedState }),
        })
      )
    );
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AnimatedBackButton className="h-8 w-8 rounded-full bg-transparent hover:bg-accent flex items-center justify-center">
              <ArrowLeft className="h-4 w-4" />
            </AnimatedBackButton>
            <h2 className="text-2xl font-semibold">Shopping Lists</h2>
            {items && items.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {items.length} total
                </Badge>
                {mealPlanItemsCount > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs flex items-center gap-1"
                  >
                    <ChefHat className="h-3 w-3" />
                    {mealPlanItemsCount} from meal plan
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[200px] pl-9"
              />
            </div>
            <Select
              value={filterType}
              onValueChange={(value: FilterType) => setFilterType(value)}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="meal-plan">Meal Plan</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
            {filteredItems.length > 0 && (
              <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                {areAllFilteredItemsChecked ? "Unselect All" : "Select All"}
              </Button>
            )}
            {filteredItems.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete All"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete All Items</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {filteredItems.length}{" "}
                      items?
                      {searchQuery &&
                        " (Only items matching your search will be deleted)"}{" "}
                      {filterType !== "all" &&
                        ` (Only ${filterType === "meal-plan" ? "meal plan" : "manual"} items will be deleted)`}{" "}
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteAllItems}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-200px)] rounded-md border p-4">
          <div className="space-y-2">
            {filteredItems.length === 0 ? (
              <div className="text-center text-muted-foreground space-y-2">
                {searchQuery || filterType !== "all" ? (
                  <p>No items match your current filters.</p>
                ) : (
                  <>
                    <p>Your shopping list is empty.</p>
                    <p className="text-sm">
                      Add ingredients from recipes or create a meal plan to get
                      started.
                    </p>
                  </>
                )}
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg p-2 hover:bg-accent"
                >
                  <div className="flex flex-1 items-center space-x-2">
                    <Checkbox
                      id={`item-${item.id}`}
                      checked={item.checked}
                      onCheckedChange={(checked) =>
                        void toggleItem(item.id, checked as boolean)
                      }
                    />
                    <div className="flex flex-1 items-center gap-2">
                      <label
                        htmlFor={`item-${item.id}`}
                        className={`flex-1 cursor-pointer ${
                          item.checked
                            ? "text-muted-foreground line-through"
                            : ""
                        }`}
                      >
                        {item.name}
                      </label>
                      {item.fromMealPlan && (
                        <Badge
                          variant="outline"
                          className="text-xs flex items-center gap-1"
                        >
                          <ChefHat className="h-3 w-3" />
                          Meal Plan
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void deleteItem(item.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </PageTransition>
  );
}
