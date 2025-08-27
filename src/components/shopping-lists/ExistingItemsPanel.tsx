"use client";

import { memo, useState } from "react";
import { ChevronDown, ChevronRight, ShoppingCart } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import type { ShoppingItem } from "~/types";

export interface ExistingItemsPanelProps {
  items: ShoppingItem[];
  highlightedItems: number[]; // Items that match new ingredients
  onItemToggle?: (itemId: number, checked: boolean) => void;
  isReadOnly?: boolean;
}

const ExistingItemRow = memo(function ExistingItemRow({
  item,
  isHighlighted,
  onToggle,
  isReadOnly,
}: {
  item: ShoppingItem;
  isHighlighted: boolean;
  onToggle?: (itemId: number, checked: boolean) => void;
  isReadOnly?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-md p-3 transition-colors ${
        isHighlighted
          ? "bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800"
          : "bg-background border border-border hover:bg-muted/50"
      }`}
    >
      <div className="flex flex-1 items-center space-x-3">
        {!isReadOnly && onToggle && (
          <Checkbox
            id={`existing-item-${item.id}`}
            checked={item.checked}
            onCheckedChange={(checked) => onToggle(item.id, checked as boolean)}
          />
        )}
        <div className="flex flex-1 items-center justify-between gap-2">
          <label
            htmlFor={`existing-item-${item.id}`}
            className={`flex-1 cursor-pointer text-sm font-medium ${
              item.checked
                ? "text-muted-foreground line-through"
                : "text-foreground"
            }`}
          >
            {item.name}
          </label>
          <div className="flex items-center gap-2">
            {item.fromMealPlan && (
              <Badge
                variant="outline"
                className="text-xs bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800"
              >
                Meal Plan
              </Badge>
            )}
            {isHighlighted && (
              <Badge
                variant="secondary"
                className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300"
              >
                Match
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export function ExistingItemsPanel({
  items,
  highlightedItems,
  onItemToggle,
  isReadOnly = false,
}: ExistingItemsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const highlightedItemsSet = new Set(highlightedItems);
  const highlightedCount = highlightedItems.length;
  const totalItems = items.length;
  const checkedItems = items.filter((item) => item.checked).length;

  if (totalItems === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3 p-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Current Shopping List
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground py-8">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="text-sm font-medium">Your shopping list is empty</p>
            <p className="text-xs mt-2 opacity-75">
              Items you add will appear here for comparison
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3 p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Current Shopping List
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{totalItems} items</Badge>
          {checkedItems > 0 && (
            <Badge variant="outline">{checkedItems} checked</Badge>
          )}
          {highlightedCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-primary/20 text-primary border-primary/30"
            >
              {highlightedCount} potential matches
            </Badge>
          )}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-0 p-4">
          <ScrollArea className="h-[350px] pr-2">
            <div className="space-y-2.5">
              {items.map((item) => (
                <ExistingItemRow
                  key={item.id}
                  item={item}
                  isHighlighted={highlightedItemsSet.has(item.id)}
                  onToggle={onItemToggle}
                  isReadOnly={isReadOnly}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
}
