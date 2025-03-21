import { db } from "../db";
import { shoppingItems } from "../db/schema";
import { and, eq, desc } from "drizzle-orm";

export async function getShoppingItems(userId: string) {
  try {
    return await db
      .select()
      .from(shoppingItems)
      .where(eq(shoppingItems.userId, userId))
      .orderBy(desc(shoppingItems.createdAt));
  } catch (error) {
    console.error("Failed to fetch shopping items:", error);
    throw new Error("Failed to fetch shopping items");
  }
}

export async function updateShoppingItem(
  userId: string,
  itemId: number,
  checked: boolean
) {
  try {
    const [updatedItem] = await db
      .update(shoppingItems)
      .set({ checked })
      .where(
        and(
          eq(shoppingItems.id, itemId),
          eq(shoppingItems.userId, userId)
        )
      )
      .returning();

    return updatedItem;
  } catch (error) {
    console.error("Failed to update shopping item:", error);
    throw new Error("Failed to update shopping item");
  }
}

export async function deleteShoppingItem(userId: string, itemId: number) {
  try {
    const [deletedItem] = await db
      .delete(shoppingItems)
      .where(
        and(
          eq(shoppingItems.id, itemId),
          eq(shoppingItems.userId, userId)
        )
      )
      .returning();

    return deletedItem;
  } catch (error) {
    console.error("Failed to delete shopping item:", error);
    throw new Error("Failed to delete shopping item");
  }
}

export async function addShoppingItems(
  userId: string,
  items: Array<{ name: string; recipeId: number }>
) {
  try {
    const itemsToInsert = items.map((item) => ({
      userId,
      name: item.name,
      recipeId: item.recipeId,
      checked: false,
    }));

    return await db
      .insert(shoppingItems)
      .values(itemsToInsert)
      .returning();
  } catch (error) {
    console.error("Failed to add shopping items:", error);
    throw new Error("Failed to add shopping items");
  }
} 