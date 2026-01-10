# Database Transactions: Why They Matter

## What Are Transactions?

A **transaction** is a sequence of database operations that are treated as a **single unit of work**. Transactions follow the **ACID** properties:

- **Atomicity**: All operations succeed, or all fail (all-or-nothing)
- **Consistency**: Database remains in a valid state
- **Isolation**: Concurrent transactions don't interfere
- **Durability**: Committed changes persist even after crashes

Think of it like a bank transfer: either both accounts update, or neither does.

---

## The Problem in Your Codebase

You have **ZERO transactions** in your codebase. This means multi-step operations can partially succeed, leaving your database in an inconsistent state.

---

## 🚨 Example 1: `deleteRecipe` - The Most Dangerous

### Current Code (BROKEN):

```typescript
// src/server/queries.ts:129-167
export async function deleteRecipe(id: number, req: NextRequest) {
  // Step 1: Delete shopping items
  await db
    .delete(shoppingItems)
    .where(and(eq(shoppingItems.recipeId, id), eq(shoppingItems.userId, userId)));
  
  // ❌ If this fails, shopping items are already deleted!
  // Step 2: Delete recipe
  const result = await db
    .delete(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
    .returning();
  
  // ❌ If Step 1 succeeds but Step 2 fails, you have:
  // - Shopping items deleted ✅
  // - Recipe still exists ❌
  // - Database in inconsistent state! 🚨
}
```

### What Can Go Wrong?

**Scenario A: Database Connection Fails Mid-Operation**
```typescript
// User clicks "Delete Recipe" for recipe ID 123
await db.delete(shoppingItems).where(...); // ✅ SUCCESS - 5 items deleted
// 💥 Network timeout! Database connection lost!
await db.delete(recipes).where(...); // ❌ FAILS - recipe still exists

// Result: Orphaned shopping items deleted, recipe still exists
// Now when user views recipe 123, it shows no shopping items (confusing!)
```

**Scenario B: Foreign Key Constraint Error**
```typescript
// User tries to delete recipe
await db.delete(shoppingItems).where(...); // ✅ SUCCESS
// Another process creates a meal plan referencing this recipe between the two deletes!
await db.delete(recipes).where(...); // ❌ FAILS - foreign key violation

// Result: Shopping items gone, recipe still exists, inconsistent state
```

**Scenario C: Concurrent Deletion**
```typescript
// User A starts deleting recipe 123
await db.delete(shoppingItems).where(...); // ✅ SUCCESS

// User B (admin) also starts deleting recipe 123 from another request
await db.delete(shoppingItems).where(...); // ✅ SUCCESS (items already gone)

// User A continues:
await db.delete(recipes).where(...); // ✅ SUCCESS - recipe deleted

// User B continues:
await db.delete(recipes).where(...); // ✅ SUCCESS - but recipe already gone!

// Both operations "succeed" but state is unclear
```

### Fixed Code (WITH TRANSACTION):

```typescript
export async function deleteRecipe(id: number, req: NextRequest) {
  const userId = await getUserIdFromRequest(req);

  // Verify recipe exists first (outside transaction to fail fast)
  const recipe = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!recipe) {
    throw new NotFoundError("Recipe not found or unauthorized");
  }

  // ✅ Wrap both operations in a transaction
  await db.transaction(async (tx) => {
    // Step 1: Delete shopping items
    await tx
      .delete(shoppingItems)
      .where(
        and(
          eq(shoppingItems.recipeId, id),
          eq(shoppingItems.userId, userId)
        )
      );

    // Step 2: Delete recipe
    const result = await tx
      .delete(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
      .returning();

    // If this point is reached, BOTH operations succeeded
    // If ANY operation fails, BOTH are automatically rolled back
    return result[0];
  });

  return { success: true, id };
}
```

**What Happens Now:**
- ✅ Both operations succeed → Everything is deleted
- ❌ Either operation fails → **Automatic rollback** → Nothing is deleted
- 🔒 Database always remains consistent

---

## 🚨 Example 2: `deleteMealPlan` - Same Problem

### Current Code (BROKEN):

```typescript
// src/server/queries/meal-planner.ts:306-325
export async function deleteMealPlan(userId: string, mealPlanId: number) {
  // Delete all planned meals
  await db.delete(plannedMeals).where(...); // Step 1
  
  // ❌ If this fails, planned meals are already deleted!
  // Delete the meal plan
  await db.delete(mealPlans).where(...); // Step 2
}
```

**Failure Scenario:**
```typescript
await db.delete(plannedMeals).where(...); // ✅ Deletes 20 planned meals
// 💥 Database disk full error!
await db.delete(mealPlans).where(...); // ❌ FAILS

// Result: 
// - 20 planned meals deleted ✅
// - Meal plan still exists ❌
// - Database shows meal plan with 0 meals (corrupted state!)
```

### Fixed Code:

```typescript
export async function deleteMealPlan(
  userId: string,
  mealPlanId: number
): Promise<void> {
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
    await tx
      .delete(mealPlans)
      .where(
        and(
          eq(mealPlans.id, mealPlanId),
          eq(mealPlans.userId, userId)
        )
      );
    
    // Both succeed or both rollback automatically
  });
}
```

---

## 🔍 Example 3: `batchUpdateShoppingItems` - Race Condition Risk

### Current Code:

```typescript
// src/server/queries/shopping-list.ts:110-169
export async function batchUpdateShoppingItems(
  userId: string,
  itemIds: number[],
  checked: boolean
) {
  // Update items
  await db.update(shoppingItems).set({ checked }).where(...);
  
  // Fetch updated items
  const updatedItems = await db.select().from(shoppingItems).where(...);
  
  // ❌ If another process modifies items between update and fetch,
  // you return stale or incorrect data
}
```

**Race Condition:**
```typescript
// Request A: Check 3 items
await db.update(shoppingItems).set({ checked: true }).where(id IN [1,2,3]);
// ⏸️ Pause here...

// Request B: User unchecks item 2 from UI
await db.update(shoppingItems).set({ checked: false }).where(id = 2);

// Request A continues:
const items = await db.select().from(shoppingItems).where(id IN [1,2,3]);
// Returns: [{id:1, checked:true}, {id:2, checked:false}, {id:3, checked:true}]
// ❌ WRONG! Request A thinks it checked item 2, but it's unchecked!
```

### Fixed Code:

```typescript
export async function batchUpdateShoppingItems(
  userId: string,
  itemIds: number[],
  checked: boolean
): Promise<ShoppingItem[]> {
  if (itemIds.length === 0) return [];

  return await db.transaction(async (tx) => {
    // Update and return in same transaction (atomic)
    const updatedItems = await tx
      .update(shoppingItems)
      .set({ checked })
      .where(
        and(
          inArray(shoppingItems.id, itemIds),
          eq(shoppingItems.userId, userId)
        )
      )
      .returning(); // ✅ Use .returning() instead of separate select

    return updatedItems.map((item) => ({
      ...item,
      recipeId: item.recipeId ?? undefined,
      createdAt: item.createdAt.toISOString(),
    }));
  });
}
```

---

## 🎓 Key Concepts

### 1. **Atomicity (All-or-Nothing)**
```typescript
// WITHOUT transaction:
await operation1(); // ✅ Succeeds
await operation2(); // ❌ Fails
// Result: Partial state (BAD)

// WITH transaction:
await db.transaction(async (tx) => {
  await tx.operation1(); // ✅ Succeeds
  await tx.operation2(); // ❌ Fails
  // Automatic rollback - both operations undone!
});
```

### 2. **Isolation (Concurrent Safety)**
Transactions prevent other operations from seeing intermediate states:

```typescript
// Time  | Transaction A           | Transaction B
// ----- | ----------------------- | -----------------------
// T1    | Begin transaction       |
// T2    | Delete shopping items   |
// T3    |                         | Query shopping items (sees OLD state!)
// T4    | Delete recipe           |
// T5    | Commit                  |
// T6    |                         | Query shopping items (sees NEW state)
```

### 3. **Consistency (Valid State)**
Database constraints are checked at transaction commit, not per operation:

```typescript
await db.transaction(async (tx) => {
  // These might individually violate constraints,
  // but together they're valid:
  await tx.delete(childRecord);
  await tx.update(parentRecord); // Now valid because child is gone
  // ✅ Constraints checked at COMMIT, not per operation
});
```

---

## 🔧 How Drizzle Transactions Work

```typescript
import { db } from "~/server/db";

await db.transaction(async (tx) => {
  // 'tx' is a transaction context
  // All operations using 'tx' are part of the same transaction
  
  await tx.insert(recipes).values({ name: "Pizza" });
  await tx.insert(shoppingItems).values({ recipeId: 123 });
  
  // If any operation throws, entire transaction rolls back
  // If all succeed, transaction commits automatically
});
```

**Important Notes:**
- If the callback throws, rollback happens automatically
- If the callback returns normally, commit happens automatically
- You can nest transactions (savepoints)
- Transaction isolation level can be configured

---

## 📋 Checklist: When to Use Transactions

Use transactions when you have:

- ✅ **Multiple related operations** (delete parent + children)
- ✅ **Read-then-write patterns** (check balance, then update)
- ✅ **Batch operations** (update multiple records together)
- ✅ **Operations that must be atomic** (transfer money: debit + credit)
- ✅ **Foreign key operations** (create related records)
- ❌ **Single operations** (just `db.select()` or single `db.update()`)

---

## 🚀 Recommended Action Items

### High Priority (Data Integrity Risks):

1. **Wrap `deleteRecipe` in transaction** ⚠️ CRITICAL
   - Currently can orphan shopping items
   - Affects core recipe deletion functionality

2. **Wrap `deleteMealPlan` in transaction** ⚠️ CRITICAL
   - Currently can leave meal plan without meals
   - Affects meal planner functionality

### Medium Priority (Consistency Improvements):

3. **Review `batchUpdateShoppingItems`**
   - Use `.returning()` within transaction
   - Prevent race conditions

4. **Review shopping list generation**
   - Any multi-step operations that should be atomic?

5. **Review recipe creation flows**
   - Creating recipe + shopping items should be atomic?

---

## 🎯 Testing Transactions

Test transaction rollback behavior:

```typescript
// Test that transaction rolls back on error
it('should rollback deleteRecipe if recipe deletion fails', async () => {
  // Mock database to fail on second operation
  const mockDb = {
    transaction: async (callback) => {
      const tx = { /* mock transaction */ };
      await callback(tx); // This will throw
    }
  };
  
  await expect(deleteRecipe(123, req)).rejects.toThrow();
  // Verify shopping items still exist (transaction rolled back)
});
```

---

## 📚 Additional Resources

- [Drizzle Transactions Docs](https://orm.drizzle.team/docs/transactions)
- [PostgreSQL Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- [ACID Properties Explained](https://en.wikipedia.org/wiki/ACID)

---

## Summary

**The Problem:** Your codebase has zero transactions, allowing multi-step operations to partially succeed, leaving the database in inconsistent states.

**The Solution:** Wrap related database operations in `db.transaction()` blocks to ensure atomicity, consistency, and data integrity.

**Priority:** Fix `deleteRecipe` and `deleteMealPlan` **immediately** - these are critical data integrity risks in production.
