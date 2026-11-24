"use client";

import Link from "next/link";
import { Search, Trash2, ChefHat, Filter, LayoutList, UtensilsCrossed, Tag } from "lucide-react";
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
import { parseApiResponse } from "~/utils/api-client";

type FilterType = "all" | "meal-plan" | "manual";
type GroupBy = "none" | "recipe" | "category";

interface ItemGroup {
  label: string;
  recipeId?: number;
  items: ShoppingItem[];
}

function getCategory(ingredientName: string | undefined, displayName: string): string {
  const name = (ingredientName ?? displayName).toLowerCase();
  if (/\b(chicken|beef|pork|salmon|shrimp|turkey|lamb|bacon|sausage|tuna|cod|tilapia|ground meat|steak|rib|brisket|wing)\b/.test(name)) return "Meat & Seafood";
  if (/\b(milk|butter|cheese|cream|yogurt|egg|cheddar|mozzarella|parmesan|brie|feta|ricotta|sour cream|half.and.half|ghee)\b/.test(name)) return "Dairy & Eggs";
  if (/\b(apple|banana|lemon|lime|orange|berry|berries|grape|mango|peach|pear|plum|strawberr|blueberr|raspberr|onion|garlic|tomato|spinach|kale|carrot|pepper|potato|mushroom|zucchini|cucumber|lettuce|broccoli|celery|avocado|herb|parsley|cilantro|basil|thyme|rosemary|dill|mint|scallion|leek|shallot|cabbage|beet|radish|squash|asparagus|artichoke|eggplant|fennel|arugula|watercress|chard|endive|ginger|jalapeno)\b/.test(name)) return "Produce";
  if (/\b(bread|bagel|tortilla|roll|bun|pita|naan|croissant|muffin|english muffin)\b/.test(name)) return "Bakery";
  if (/\b(frozen|ice cream|gelato|sorbet)\b/.test(name)) return "Frozen";
  if (/\b(flour|sugar|salt|black pepper|white pepper|oil|olive oil|vinegar|sauce|paste|broth|stock|rice|pasta|noodle|oat|bean|lentil|canned|honey|syrup|vanilla|baking|soda|powder|yeast|cocoa|chocolate|mustard|ketchup|mayo|mayonnaise|soy sauce|worcestershire|hot sauce|cornstarch|panko|breadcrumb|dried|cumin|paprika|turmeric|cinnamon|nutmeg|cayenne|oregano|bay leaf|chili flake|coriander|cardamom|allspice|clove|star anise)\b/.test(name)) return "Pantry";
  return "Other";
}

export function ShoppingListsViewWithBackButton() {
  const [items, setItems] = useState<ShoppingItem[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredItems = useMemo(() => {
    if (!items) return [];

    let filtered = items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

  const areAllFilteredItemsChecked = useMemo(
    () =>
      filteredItems.length > 0 && filteredItems.every((item) => item.checked),
    [filteredItems]
  );

  const groups = useMemo((): ItemGroup[] | null => {
    if (groupBy === "none") return null;

    const map = new Map<string, ItemGroup>();

    for (const item of filteredItems) {
      const key =
        groupBy === "recipe"
          ? (item.recipeName ?? "__other__")
          : getCategory(item.ingredientName, item.name);

      if (!map.has(key)) {
        map.set(key, {
          label: groupBy === "recipe" ? (item.recipeName ?? "Other") : key,
          recipeId: groupBy === "recipe" ? item.recipeId : undefined,
          items: [],
        });
      }
      map.get(key)!.items.push(item);
    }

    return [...map.values()].sort((a, b) =>
      a.label === "Other" ? 1 : b.label === "Other" ? -1 : a.label.localeCompare(b.label)
    );
  }, [filteredItems, groupBy]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("/api/shopping-lists");
        if (!response.ok) {
          throw new RecipeError("Failed to fetch items", 500);
        }
        const data = await parseApiResponse<ShoppingItem[]>(response);
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
        setItems([]);
      }
    };

    void fetchItems();
  }, []);

  if (items === null) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex h-64 items-center justify-center rounded-md border p-4">
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }

  const toggleItem = async (itemId: number, checked: boolean) => {
    try {
      const response = await fetch(`/api/shopping-lists/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checked }),
      });

      if (!response.ok) {
        throw new RecipeError("Failed to update item", 500);
      }

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
      for (const item of filteredItems) {
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

  const toggleSelectAll = async () => {
    const newCheckedState = !areAllFilteredItemsChecked;
    const itemIds = filteredItems.map((item) => item.id);

    if (itemIds.length === 0) return;

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

    try {
      const response = await fetch("/api/shopping-lists/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds, checked: newCheckedState }),
      });

      if (!response.ok) {
        throw new Error("Failed to update items");
      }

      const data = await parseApiResponse<{ items: ShoppingItem[] }>(response);
      if (data.items) {
        setItems((prev) => {
          if (!prev) return prev;
          const itemMap = new Map(data.items.map((item) => [item.id, item]));
          return prev.map((item) => itemMap.get(item.id) ?? item);
        });
      }
    } catch (error) {
      logger.error(
        "Failed to batch update shopping items",
        error instanceof Error ? error : new Error(String(error)),
        {
          component: "ShoppingListsViewWithBackButton",
          action: "toggleSelectAll",
        }
      );
      setItems((prev) => {
        if (!prev) return prev;
        const itemMap = new Map(filteredItems.map((item) => [item.id, item]));
        return prev.map((item) => itemMap.get(item.id) ?? item);
      });
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Controls Section */}
      <div className="space-y-4 border-b border-border pb-4">
        {/* Item Count Info */}
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {filteredItems.length} of {items.length} items
              {filterType !== "all" || searchQuery ? " shown" : ""}
            </span>
            {mealPlanItemsCount > 0 && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <ChefHat className="h-3 w-3" />
                {mealPlanItemsCount} from meal plan
              </Badge>
            )}
          </div>
        )}

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Search, Filter, Group */}
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={filterType}
              onValueChange={(value: FilterType) => setFilterType(value)}
            >
              <SelectTrigger className="w-[130px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="meal-plan">Meal Plan</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={groupBy}
              onValueChange={(value: GroupBy) => setGroupBy(value)}
            >
              <SelectTrigger className="w-[140px]">
                <LayoutList className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Flat List</SelectItem>
                <SelectItem value="recipe">By Recipe</SelectItem>
                <SelectItem value="category">By Category</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          {filteredItems.length > 0 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                {areAllFilteredItemsChecked ? "Unselect All" : "Select All"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? "Deleting..." : "Delete All"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete All Items</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {filteredItems.length} items?
                      {searchQuery && " (Only items matching your search will be deleted)"}
                      {filterType !== "all" &&
                        ` (Only ${filterType === "meal-plan" ? "meal plan" : "manual"} items will be deleted)`}
                      {" "}This action cannot be undone.
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
            </div>
          )}
        </div>
      </div>

      {/* Shopping List Items */}
      <ScrollArea className="h-[calc(100vh-300px)] rounded-md border bg-black p-4">
        {filteredItems.length === 0 ? (
          <div className="text-center text-muted-foreground space-y-2">
            {searchQuery || filterType !== "all" ? (
              <p>No items match your current filters.</p>
            ) : (
              <>
                <p>Your shopping list is empty.</p>
                <p className="text-sm">
                  Add ingredients from recipes or create a meal plan to get started.
                </p>
              </>
            )}
          </div>
        ) : groups ? (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  {groupBy === "recipe" ? (
                    <UtensilsCrossed className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  {groupBy === "recipe" && group.recipeId ? (
                    <Link
                      href={`/recipes/${group.recipeId}`}
                      className="text-sm font-semibold hover:underline"
                    >
                      {group.label}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold">{group.label}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    ({group.items.length})
                  </span>
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onToggle={toggleItem}
                      onDelete={deleteItem}
                      showRecipeBadge={groupBy !== "recipe"}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onToggle={toggleItem}
                onDelete={deleteItem}
                showRecipeBadge
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface ItemRowProps {
  item: ShoppingItem;
  onToggle: (id: number, checked: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  showRecipeBadge: boolean;
}

function ItemRow({ item, onToggle, onDelete, showRecipeBadge }: ItemRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg p-2 hover:bg-accent">
      <div className="flex flex-1 items-center space-x-2">
        <Checkbox
          id={`item-${item.id}`}
          checked={item.checked}
          onCheckedChange={(checked) => void onToggle(item.id, checked as boolean)}
        />
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <label
            htmlFor={`item-${item.id}`}
            className={`flex-1 cursor-pointer ${item.checked ? "text-muted-foreground line-through" : ""}`}
          >
            {item.name}
          </label>
          {showRecipeBadge && (
            item.recipeName && item.recipeId ? (
              <Link href={`/recipes/${item.recipeId}`}>
                <Badge
                  variant="outline"
                  className="text-xs flex items-center gap-1 cursor-pointer hover:bg-accent"
                >
                  <ChefHat className="h-3 w-3" />
                  {item.recipeName}
                </Badge>
              </Link>
            ) : item.fromMealPlan ? (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <ChefHat className="h-3 w-3" />
                Meal Plan
              </Badge>
            ) : null
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void onDelete(item.id)}
        className="h-8 w-8 p-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
