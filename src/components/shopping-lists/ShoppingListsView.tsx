"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "~/components/ui/checkbox";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";

interface ShoppingItem {
  id: number;
  name: string;
  checked: boolean;
  createdAt: string;
  recipeId?: number;
}

export function ShoppingListsView() {
  const [items, setItems] = useState<ShoppingItem[]>([]);

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
      }
    };

    void fetchItems();
  }, []);

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

      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, checked } : item)),
      );
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

      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-semibold">Shopping List</h2>
      <ScrollArea className="h-[calc(100vh-200px)] rounded-md border p-4">
        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Your shopping list is empty. Add ingredients from recipes to get
              started.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg p-2 hover:bg-accent"
              >
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={item.checked}
                    onCheckedChange={(checked) =>
                      void toggleItem(item.id, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`item-${item.id}`}
                    className={`cursor-pointer ${
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
