"use client";

import { useState, useEffect, useMemo } from "react";
import { Checkbox } from "~/components/ui/checkbox";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Trash2, Search } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
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

interface ShoppingItem {
  id: number;
  name: string;
  checked: boolean;
  createdAt: string;
  recipeId?: number;
}

export function ShoppingListsView() {
  const [items, setItems] = useState<ShoppingItem[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [items, searchQuery]);

  const areAllFilteredItemsChecked = useMemo(
    () =>
      filteredItems.length > 0 && filteredItems.every((item) => item.checked),
    [filteredItems],
  );

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("/api/shopping-lists");
        if (!response.ok) {
          throw new Error("Failed to fetch items");
        }
        const data = (await response.json()) as ShoppingItem[];
        setItems(data);
      } catch (error) {
        console.error("Error fetching items:", error);
        setItems([]); // Set empty array on error
      }
    };

    void fetchItems();
  }, []);

  // Show loading spinner while items is null
  if (items === null) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 sm:space-y-6 sm:px-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold sm:text-2xl">Shopping List</h2>
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
        throw new Error("Failed to update item");
      }

      // Update local state
      setItems((prev) => {
        if (!prev) return prev;
        return prev.map((item) =>
          item.id === itemId ? { ...item, checked } : item,
        );
      });
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const deleteItem = async (itemId: number) => {
    try {
      const response = await fetch(`/api/shopping-lists/items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      // Update local state
      setItems((prev) => {
        if (!prev) return prev;
        return prev.filter((item) => item.id !== itemId);
      });
    } catch (error) {
      console.error("Error deleting item:", error);
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
      console.error("Error deleting items:", error);
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
      filteredItems.forEach((item) => {
        const index = updatedItems.findIndex((i) => i.id === item.id);
        if (index !== -1) {
          updatedItems[index] = { ...item, checked: newCheckedState };
        }
      });
      return updatedItems;
    });

    // Update server
    void Promise.all(
      filteredItems.map((item) =>
        fetch(`/api/shopping-lists/items/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checked: newCheckedState }),
        }),
      ),
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 sm:space-y-6 sm:px-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold sm:text-2xl">Shopping List</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:w-[200px]"
            />
          </div>
          {filteredItems.length > 0 && (
            <div className="flex gap-2 sm:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="flex-1 sm:flex-none"
              >
                {areAllFilteredItemsChecked ? "Unselect All" : "Select All"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting}
                    className="flex-1 sm:flex-none"
                  >
                    {isDeleting ? "Deleting..." : "Delete All"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="sm:max-w-[425px]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete All Items</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm sm:text-base">
                      Are you sure you want to delete {filteredItems.length}{" "}
                      items?
                      {searchQuery &&
                        " (Only items matching your search will be deleted)"}{" "}
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
                    <AlertDialogCancel className="w-full sm:w-auto">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteAllItems}
                      className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
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
      <ScrollArea className="h-[calc(100vh-200px)] rounded-md border p-2 sm:p-4">
        <div className="space-y-2">
          {filteredItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
              <p className="text-sm text-muted-foreground sm:text-base">
                {searchQuery
                  ? "No items match your search."
                  : "Your shopping list is empty. Add ingredients from recipes to get started."}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between rounded-lg p-3 hover:bg-accent"
              >
                <div className="flex flex-1 items-center space-x-3">
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={item.checked}
                    onCheckedChange={(checked) =>
                      void toggleItem(item.id, checked as boolean)
                    }
                    className="h-5 w-5 sm:h-4 sm:w-4"
                  />
                  <label
                    htmlFor={`item-${item.id}`}
                    className={`flex-1 cursor-pointer text-sm sm:text-base ${
                      item.checked ? "text-muted-foreground line-through" : ""
                    }`}
                  >
                    {item.name}
                  </label>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void deleteItem(item.id)}
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 sm:h-10 sm:w-10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
