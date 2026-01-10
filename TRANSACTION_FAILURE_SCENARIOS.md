# Real-World Failure Scenarios: Why You Need Transactions

## 🎬 Scenario Playbooks

These are **real situations** that can happen in production without transactions.

---

## Scenario 1: Recipe Deletion with Network Issues

### The Setup:
User deletes a recipe that has 15 shopping list items associated with it.

### What Happens WITHOUT Transactions:

```typescript
// Time  | Operation                          | Result
// ----- | ---------------------------------- | ------
// T1    | User clicks "Delete Recipe"        |
// T2    | DELETE shopping_items WHERE...     | ✅ 15 items deleted
// T3    | 💥 Network timeout! (2 sec)        | Connection lost
// T4    | DELETE recipes WHERE id=123        | ❌ NEVER EXECUTED
// T5    | User sees error: "Delete failed"   |
```

### Database State:
```
recipes table:
  id: 123, name: "Pizza Recipe"  ← STILL EXISTS ❌

shopping_items table:
  (all items for recipe 123 deleted)  ← GONE ✅
```

### User Experience:
- User sees error message
- User tries again... but shopping items are already gone
- Recipe shows up with 0 shopping items (confusing!)
- User reports bug: "Deleted recipe still appears"

### What Happens WITH Transactions:

```typescript
await db.transaction(async (tx) => {
  await tx.delete(shoppingItems).where(...); // ✅ Deleted (pending commit)
  // 💥 Network timeout!
  await tx.delete(recipes).where(...); // ❌ NEVER EXECUTED
  // Transaction automatically rolls back
  // Shopping items are restored! ✅
});
```

### Database State (WITH transaction):
```
recipes table:
  id: 123, name: "Pizza Recipe"  ← EXISTS ✅

shopping_items table:
  (all 15 items still exist)  ← EXISTS ✅

Everything is consistent! Both operations rolled back.
```

---

## Scenario 2: Concurrent Deletion Race Condition

### The Setup:
Two users (or browser tabs) try to delete the same recipe simultaneously.

### What Happens WITHOUT Transactions:

```typescript
// Request A (User's browser tab 1)
await db.delete(shoppingItems).where(recipeId=123); // ✅ Deletes items
// ⏸️ Pause (tab switched, slow network)

// Request B (User's browser tab 2 - same user)
await db.delete(shoppingItems).where(recipeId=123); // ✅ "Success" (0 rows, items already gone)
await db.delete(recipes).where(id=123);             // ✅ Deletes recipe
// Returns: { success: true }

// Request A continues
await db.delete(recipes).where(id=123); // ❌ 0 rows deleted (recipe already gone)
// Returns: { success: false } or throws NotFoundError
```

### Database State:
```
recipes table:
  (recipe 123 deleted)  ← GONE ✅

shopping_items table:
  (items deleted twice - first request succeeded)  ← GONE ✅
```

### User Experience:
- Tab 1: Error "Recipe not found" ❌
- Tab 2: Success "Recipe deleted" ✅
- User confused: "Why did one tab fail and one succeed?"

### With Transactions (Isolation):
```typescript
// Request A starts transaction
tx.begin();
tx.delete(shoppingItems)... // Locks rows
// ⏸️ Pause

// Request B starts transaction (waiting for lock)
tx.begin();
tx.delete(shoppingItems)... // ⏳ WAITING (blocked by Request A)
tx.delete(recipes)...       // ⏳ WAITING

// Request A continues
tx.delete(recipes)... // ✅ Success
tx.commit();          // ✅ Both deletes committed

// Request B now sees recipe is already deleted
tx.delete(shoppingItems)... // ✅ 0 rows (already deleted)
tx.delete(recipes)...       // ✅ 0 rows (already deleted)
tx.commit();                // ✅ Both succeed (0 rows = success)

Both operations complete successfully with correct state!
```

---

## Scenario 3: Meal Plan Deletion with Partial Failure

### The Setup:
User deletes a meal plan with 21 planned meals. Database runs out of disk space mid-operation.

### What Happens WITHOUT Transactions:

```typescript
// Delete planned meals
await db.delete(plannedMeals).where(mealPlanId=456); // ✅ 21 meals deleted
// 💥 Disk full! PostgreSQL cannot write transaction log
await db.delete(mealPlans).where(id=456);             // ❌ FAILS with "disk full" error
```

### Database State:
```
meal_plans table:
  id: 456, week_start: "2025-01-06"  ← STILL EXISTS ❌

planned_meals table:
  (all 21 meals for plan 456 deleted)  ← GONE ✅
```

### User Experience:
- Database error: "Disk full"
- Meal plan shows up in UI with 0 meals
- User confused: "I have an empty meal plan"
- System admin gets alerted: Database integrity issue

### What Happens WITH Transactions:

```typescript
await db.transaction(async (tx) => {
  await tx.delete(plannedMeals).where(...); // ✅ 21 meals deleted (pending)
  // 💥 Disk full!
  await tx.delete(mealPlans).where(...);    // ❌ FAILS
  // Automatic rollback - all 21 planned meals restored
});
```

### Database State (WITH transaction):
```
meal_plans table:
  id: 456, week_start: "2025-01-06"  ← EXISTS ✅

planned_meals table:
  (all 21 meals still exist)  ← EXISTS ✅

Consistent state maintained!
```

---

## Scenario 4: Batch Shopping List Update with Read-Write Race

### The Setup:
User checks off 10 shopping items. Between the update and the fetch, another process modifies some items.

### What Happens WITHOUT Transactions:

```typescript
// Request A: User checks 10 items
await db.update(shoppingItems)
  .set({ checked: true })
  .where(id IN [1,2,3,4,5,6,7,8,9,10]); // ✅ All updated
// ⏸️ Brief pause (50ms)

// Request B: User unchecks item 5 from another tab
await db.update(shoppingItems)
  .set({ checked: false })
  .where(id = 5); // ✅ Item 5 unchecked

// Request A continues:
const items = await db.select()
  .from(shoppingItems)
  .where(id IN [1,2,3,4,5,6,7,8,9,10]);
// Returns: [{id:5, checked:false}, ...] ← WRONG! User thinks they checked it
```

### User Experience:
- User checks 10 items
- UI shows 9 checked, 1 unchecked (item 5)
- User confused: "I just checked that!"
- User reports bug: "Checkbox unchecks itself"

### With Transactions (Snapshot Isolation):
```typescript
// Request A starts transaction
await db.transaction(async (tx) => {
  // Transaction sees "snapshot" of database at start time
  await tx.update(shoppingItems)
    .set({ checked: true })
    .where(id IN [1,2,3,4,5,6,7,8,9,10]);
  
  const items = await tx.select()
    .from(shoppingItems)
    .where(id IN [1,2,3,4,5,6,7,8,9,10]);
  // ✅ Sees consistent state: all 10 items checked (from snapshot)
  
  // Commit happens - Request B's change is overwritten (last write wins)
  // OR Request B's transaction commits first, Request A sees item 5 as unchecked
  // Either way, state is consistent within each transaction
});
```

---

## Scenario 5: Adding Processed Ingredients with Partial Failure

### The Setup:
User adds 20 ingredients from meal plan to shopping list. 10 need to be combined with existing items, 10 are new.

### What Happens WITHOUT Transactions:

```typescript
// Combine 10 existing items
for (const ingredient of toCombine) {
  await db.update(shoppingItems)
    .set({ name: combinedName })
    .where(id = existingItemId);
  // ✅ Items 1-9 updated successfully
  // ❌ Item 10: Foreign key constraint error (recipe was deleted)
  // Loop continues, error swallowed
}

// Add 10 new items
const newItems = await addShoppingItems(userId, toAdd); // ✅ All 10 inserted
```

### Database State:
```
shopping_items:
  - Items 1-9: Updated with combined names ✅
  - Item 10: NOT updated (recipe reference invalid) ❌
  - New items 11-20: All inserted ✅
```

### User Experience:
- User sees "20 items added" success message
- Only 19 items actually processed correctly
- Item 10 is in inconsistent state
- User reports bug: "Some ingredients don't combine properly"

### What Happens WITH Transactions:

```typescript
await db.transaction(async (tx) => {
  // Combine existing items
  for (const ingredient of toCombine) {
    await tx.update(shoppingItems)
      .set({ name: combinedName })
      .where(id = existingItemId);
    // Item 10 fails with constraint error
  }
  
  // ❌ Transaction automatically rolls back ALL changes
  // Items 1-9 are restored to original state
  // Error is thrown, user sees proper error message
  // NO partial state!
});
```

---

## 📊 Impact Summary

### Without Transactions:
- ❌ **Partial failures** leave database inconsistent
- ❌ **Race conditions** cause unpredictable behavior  
- ❌ **User confusion** from inconsistent UI states
- ❌ **Debugging nightmares** - hard to reproduce issues
- ❌ **Data corruption** - orphaned records, broken references
- ❌ **Production incidents** - support tickets, user complaints

### With Transactions:
- ✅ **All-or-nothing** - operations complete fully or rollback completely
- ✅ **Consistency** - database always in valid state
- ✅ **Isolation** - concurrent requests don't interfere
- ✅ **Reliability** - predictable behavior
- ✅ **Data integrity** - no orphaned records
- ✅ **Production confidence** - fewer bugs, better UX

---

## 🎯 Priority: Why `deleteRecipe` is CRITICAL

1. **High Frequency**: Recipe deletion is a common operation
2. **Cascading Effects**: Deleting a recipe affects shopping items
3. **User-Visible**: Users will notice inconsistencies immediately
4. **Data Integrity**: Orphaned shopping items create confusion
5. **Production Risk**: Already deployed code is vulnerable RIGHT NOW

**This should be fixed immediately.**

---

## 🔧 Next Steps

1. **Fix `deleteRecipe`** - Wrap in transaction TODAY
2. **Fix `deleteMealPlan`** - Wrap in transaction THIS WEEK
3. **Review `addProcessedIngredientsToShoppingList`** - Complex multi-step operation
4. **Audit all delete operations** - Look for multi-step patterns
5. **Add transaction tests** - Verify rollback behavior

---

## 💡 Key Takeaway

> **Transactions are not optional for multi-step database operations.**  
> Without them, you're playing Russian roulette with data integrity.  
> One network hiccup, one concurrent request, one disk error can corrupt your database state.

**The fix is simple, the impact is huge.**
