# Transaction Implementation: Before & After

This document shows **exactly** how to fix the transaction issues in your codebase.

---

## Example 1: Fixing `deleteRecipe` - The Critical One

### ❌ BEFORE (BROKEN - No Transaction):

```typescript
// src/server/queries.ts:129-167
export async function deleteRecipe(id: number, req: NextRequest) {
  const userId = await getUserIdFromRequest(req);

  // Verify recipe exists
  const recipe = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!recipe) {
    throw new NotFoundError("Recipe not found or unauthorized");
  }

  // ❌ PROBLEM 1: Not in transaction - can partially fail
  // Delete associated shopping items
  await db
    .delete(shoppingItems)
    .where(
      and(
        eq(shoppingItems.recipeId, id),
        eq(shoppingItems.userId, userId)
      )
    );

  // ❌ PROBLEM 2: If this fails, shopping items are already deleted!
  // Delete the recipe
  const result = await db
    .delete(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
    .returning();

  if (result.length === 0) {
    throw new NotFoundError("Recipe not found or unauthorized");
  }

  return { success: true, id };
}
```

**Problems:**
- ❌ If recipe deletion fails, shopping items are orphaned
- ❌ No rollback mechanism
- ❌ Database can end up in inconsistent state
- ❌ User sees error but data is partially deleted

---

### ✅ AFTER (FIXED - With Transaction):

```typescript
// src/server/queries.ts:129-167
export async function deleteRecipe(id: number, req: NextRequest) {
  const userId = await getUserIdFromRequest(req);

  // Verify recipe exists first (outside transaction for fast failure)
  const recipe = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!recipe) {
    throw new NotFoundError("Recipe not found or unauthorized");
  }

  // ✅ SOLUTION: Wrap both operations in a transaction
  await db.transaction(async (tx) => {
    // Step 1: Delete associated shopping items
    await tx
      .delete(shoppingItems)
      .where(
        and(
          eq(shoppingItems.recipeId, id),
          eq(shoppingItems.userId, userId)
        )
      );

    // Step 2: Delete the recipe
    const result = await tx
      .delete(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
      .returning();

    // ✅ If we reach here, BOTH operations succeeded
    // ✅ If ANY operation fails, BOTH are automatically rolled back
    // ✅ No partial state possible!

    if (result.length === 0) {
      // This shouldn't happen since we verified above, but safety check
      throw new NotFoundError("Recipe not found or unauthorized");
    }

    return result[0];
  });

  // ✅ Transaction committed successfully - all operations completed
  return { success: true, id };
}
```

**Benefits:**
- ✅ **Atomicity**: Both operations succeed or both fail
- ✅ **Automatic rollback**: If recipe deletion fails, shopping items are restored
- ✅ **Consistency**: Database always in valid state
- ✅ **Safety**: No partial deletions possible

**What happens on failure:**
```typescript
// If recipe deletion fails:
await tx.delete(shoppingItems)... // ✅ Executed (pending commit)
await tx.delete(recipes)...       // ❌ FAILS (e.g., network error)
// 💥 Transaction automatically rolls back
// ✅ Shopping items are restored
// ✅ Recipe is restored
// ✅ Database remains consistent
```

---

## Example 2: Fixing `deleteMealPlan`

### ❌ BEFORE (BROKEN):

```typescript
// src/server/queries/meal-planner.ts:306-325
export async function deleteMealPlan(
  userId: string,
  mealPlanId: number
): Promise<void> {
  // ❌ Not atomic - can partially fail
  // Delete all planned meals
  await db
    .delete(plannedMeals)
    .where(
      and(
        eq(plannedMeals.userId, userId),
        eq(plannedMeals.mealPlanId, mealPlanId)
      )
    );

  // ❌ If this fails, planned meals are already deleted!
  // Delete the meal plan
  await db
    .delete(mealPlans)
    .where(and(eq(mealPlans.id, mealPlanId), eq(mealPlans.userId, userId)));
}
```

### ✅ AFTER (FIXED):

```typescript
// src/server/queries/meal-planner.ts:306-325
export async function deleteMealPlan(
  userId: string,
  mealPlanId: number
): Promise<void> {
  // ✅ Wrap both operations in transaction
  await db.transaction(async (tx) => {
    // Delete all planned meals
    await tx
      .delete(plannedMeals)
      .where(
        and(
          eq(plannedMeals.userId, userId),
          eq(plannedMeals.mealPlanId, mealPlanId)
        )
      );

    // Delete the meal plan
    const result = await tx
      .delete(mealPlans)
      .where(and(eq(mealPlans.id, mealPlanId), eq(mealPlans.userId, userId)))
      .returning();

    // ✅ Both succeed or both rollback
    if (result.length === 0) {
      throw new NotFoundError("Meal plan not found or unauthorized");
    }
  });
}
```

---

## Example 3: Fixing `batchUpdateShoppingItems` (Race Condition Fix)

### ❌ BEFORE (RACE CONDITION):

```typescript
// src/server/queries/shopping-list.ts:110-169
export async function batchUpdateShoppingItems(
  userId: string,
  itemIds: number[],
  checked: boolean
): Promise<ShoppingItem[]> {
  // ❌ Update and fetch are separate operations
  await db
    .update(shoppingItems)
    .set({ checked })
    .where(
      and(
        inArray(shoppingItems.id, itemIds),
        eq(shoppingItems.userId, userId)
      )
    );

  // ❌ Race condition: Another process could modify items here!
  // ❌ Returns stale data if items changed between update and select
  const updatedItems = await db
    .select(...)
    .from(shoppingItems)
    .where(
      and(
        inArray(shoppingItems.id, itemIds),
        eq(shoppingItems.userId, userId)
      )
    );

  return updatedItems.map(...);
}
```

### ✅ AFTER (FIXED):

```typescript
// src/server/queries/shopping-list.ts:110-169
export async function batchUpdateShoppingItems(
  userId: string,
  itemIds: number[],
  checked: boolean
): Promise<ShoppingItem[]> {
  if (itemIds.length === 0) {
    return [];
  }

  // ✅ Use transaction + .returning() for atomic operation
  return await db.transaction(async (tx) => {
    // ✅ Update and return in same atomic operation
    const updatedItems = await tx
      .update(shoppingItems)
      .set({ checked })
      .where(
        and(
          inArray(shoppingItems.id, itemIds),
          eq(shoppingItems.userId, userId)
        )
      )
      .returning({  // ✅ No separate select needed - returns updated rows
        id: shoppingItems.id,
        userId: shoppingItems.userId,
        name: shoppingItems.name,
        checked: shoppingItems.checked,
        recipeId: shoppingItems.recipeId,
        fromMealPlan: shoppingItems.fromMealPlan,
        createdAt: shoppingItems.createdAt,
      });

    // ✅ Convert Date objects to strings
    return updatedItems.map((item) => ({
      ...item,
      recipeId: item.recipeId ?? undefined,
      createdAt: item.createdAt.toISOString(),
    }));
  });
}
```

**Benefits:**
- ✅ **Atomic**: Update and fetch in single operation
- ✅ **No race conditions**: Transaction isolation prevents concurrent modifications
- ✅ **Efficient**: `.returning()` eliminates need for separate select
- ✅ **Consistent**: Always returns accurate, up-to-date data

---

## Example 4: Fixing `addProcessedIngredientsToShoppingList` (Complex Multi-Step)

### ❌ BEFORE (PARTIAL FAILURE RISK):

```typescript
// src/server/queries/shopping-list.ts:548-723
export async function addProcessedIngredientsToShoppingList(...) {
  // Combine existing items
  for (const ingredient of toCombine) {
    await db.update(shoppingItems)
      .set({ name: combinedName })
      .where(id = existingItemId);
    // ❌ If one update fails, others already succeeded
  }

  // Add new items
  const newItems = await addShoppingItems(userId, toAdd);
  // ❌ If this fails, updates are already committed
}
```

### ✅ AFTER (FIXED):

```typescript
// src/server/queries/shopping-list.ts:548-723
export async function addProcessedIngredientsToShoppingList(
  userId: string,
  ingredients: ProcessedIngredient[]
): Promise<{
  addedItems: ShoppingItem[];
  updatedItems: ShoppingItem[];
}> {
  // ✅ Wrap entire operation in transaction
  return await db.transaction(async (tx) => {
    const addedItems: ShoppingItem[] = [];
    const updatedItems: ShoppingItem[] = [];

    // Process and categorize ingredients (same as before)
    // ... categorization logic ...

    // ✅ Update existing items (within transaction)
    if (toCombine.length > 0) {
      const existingItemIds = toCombine
        .map((ing) => ing.duplicateAction?.existingItemId)
        .filter((id): id is number => id != null);

      if (existingItemIds.length > 0) {
        const existingItems = await tx  // ✅ Use tx instead of db
          .select({...})
          .from(shoppingItems)
          .where(and(inArray(shoppingItems.id, existingItemIds), ...));

        // Update each item (using tx)
        for (const ingredient of toCombine) {
          const existingItem = existingItems.find(...);

          if (existingItem) {
            try {
              const combinedName = `${existingItem.name} + ${ingredient.displayName}`;

              // ✅ Use .returning() to get updated row in one operation
              const [updatedItem] = await tx
                .update(shoppingItems)
                .set({ name: combinedName, fromMealPlan: true })
                .where(and(eq(shoppingItems.id, existingItem.id), ...))
                .returning({  // ✅ Get updated row immediately
                  id: shoppingItems.id,
                  userId: shoppingItems.userId,
                  name: shoppingItems.name,
                  checked: shoppingItems.checked,
                  recipeId: shoppingItems.recipeId,
                  fromMealPlan: shoppingItems.fromMealPlan,
                  createdAt: shoppingItems.createdAt,
                });

              if (updatedItem) {
                updatedItems.push({
                  ...updatedItem,
                  recipeId: updatedItem.recipeId ?? undefined,
                  createdAt: updatedItem.createdAt.toISOString(),
                });
              }
            } catch (error) {
              // ✅ If update fails, transaction will rollback all changes
              logger.error("Failed to combine item, will add as new", error);
              toAdd.push(ingredient); // Add to new items list instead
            }
          } else {
            toAdd.push(ingredient);
          }
        }
      }
    }

    // ✅ Insert new items (within same transaction)
    if (toAdd.length > 0) {
      const itemsToInsert = toAdd.map((ingredient) => ({
        userId,
        name: ingredient.displayName,
        recipeId: ingredient.sourceRecipes[0]?.recipeId,
        checked: false,
        fromMealPlan: true,
      }));

      // ✅ Use tx.insert instead of separate function call
      const insertedItems = await tx
        .insert(shoppingItems)
        .values(itemsToInsert)
        .returning({
          id: shoppingItems.id,
          userId: shoppingItems.userId,
          name: shoppingItems.name,
          checked: shoppingItems.checked,
          recipeId: shoppingItems.recipeId,
          fromMealPlan: shoppingItems.fromMealPlan,
          createdAt: shoppingItems.createdAt,
        });

      addedItems.push(
        ...insertedItems.map((item) => ({
          ...item,
          recipeId: item.recipeId ?? undefined,
          createdAt: item.createdAt.toISOString(),
        }))
      );
    }

    // ✅ All operations succeed or all rollback
    return { addedItems, updatedItems };
  });
}
```

**Key Changes:**
- ✅ All database operations use `tx` (transaction context) instead of `db`
- ✅ `.returning()` used to eliminate separate select queries
- ✅ Entire operation is atomic - all updates and inserts succeed or all rollback
- ✅ No partial state possible

---

## 🎓 Drizzle Transaction Patterns

### Pattern 1: Simple Multi-Step Operation

```typescript
await db.transaction(async (tx) => {
  await tx.delete(child);
  await tx.delete(parent);
  // Both succeed or both rollback
});
```

### Pattern 2: Using .returning() for Efficiency

```typescript
await db.transaction(async (tx) => {
  const result = await tx
    .update(table)
    .set({ column: value })
    .where(...)
    .returning(); // ✅ Returns updated rows - no separate select needed
});
```

### Pattern 3: Error Handling

```typescript
try {
  await db.transaction(async (tx) => {
    await tx.delete(...);
    await tx.delete(...);
    // If this throws, transaction automatically rolls back
  });
} catch (error) {
  // All changes were rolled back
  // Handle error
}
```

### Pattern 4: Conditional Operations

```typescript
await db.transaction(async (tx) => {
  const item = await tx.select().from(table).where(...).limit(1);
  
  if (item) {
    await tx.update(table).set({...}).where(...);
  } else {
    await tx.insert(table).values({...});
  }
  // All operations in same transaction
});
```

---

## 📋 Migration Checklist

### High Priority:
- [ ] Fix `deleteRecipe` in `src/server/queries.ts`
- [ ] Fix `deleteMealPlan` in `src/server/queries/meal-planner.ts`

### Medium Priority:
- [ ] Fix `batchUpdateShoppingItems` in `src/server/queries/shopping-list.ts`
- [ ] Fix `addProcessedIngredientsToShoppingList` in `src/server/queries/shopping-list.ts`
- [ ] Review `addShoppingItems` - check if it needs transaction

### Review:
- [ ] Audit all `delete` operations for multi-step patterns
- [ ] Audit all `update` + `select` patterns (use `.returning()`)
- [ ] Check for any loop-based database operations

---

## 🧪 Testing Transactions

```typescript
// Test transaction rollback
it('should rollback deleteRecipe if recipe deletion fails', async () => {
  // Create test recipe with shopping items
  const recipe = await createTestRecipe(userId);
  await createTestShoppingItems(userId, recipe.id, 5);

  // Mock database to fail on second operation
  const originalDelete = db.delete;
  let callCount = 0;
  db.delete = jest.fn().mockImplementation((table) => {
    callCount++;
    if (callCount === 2) {
      // Fail on recipe deletion
      throw new Error('Database error');
    }
    return originalDelete.call(db, table);
  });

  // Attempt deletion
  await expect(deleteRecipe(recipe.id, mockRequest)).rejects.toThrow();

  // Verify rollback: both recipe and items should still exist
  const stillExists = await db.select().from(recipes).where(eq(recipes.id, recipe.id));
  const itemsStillExist = await db.select().from(shoppingItems).where(eq(shoppingItems.recipeId, recipe.id));

  expect(stillExists.length).toBe(1); // Recipe still exists
  expect(itemsStillExist.length).toBe(5); // All items still exist

  // Restore
  db.delete = originalDelete;
});
```

---

## 🚀 Quick Start: Fix `deleteRecipe` Now

1. Open `src/server/queries.ts`
2. Find `deleteRecipe` function (line 129)
3. Wrap the two `db.delete()` calls in `db.transaction()`
4. Change `db.delete()` to `tx.delete()` inside transaction
5. Test it works!

**That's it!** Your most critical data integrity issue is fixed.

---

## 💡 Key Takeaways

1. **Always use transactions for multi-step operations**
2. **Use `.returning()` instead of separate select queries**
3. **Replace `db` with `tx` inside transactions**
4. **Transactions automatically rollback on errors**
5. **Verify operations outside transaction (fast failure)**

**The fix is simple. The impact is huge. Do it now.**
