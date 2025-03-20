import { NextResponse, type NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db } from "~/server/db";
import { shoppingItems } from "~/server/db/schema";

// We no longer need to create shopping lists since we have one list per user
export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all items for the user, sorted by creation date
    const items = await db
      .select()
      .from(shoppingItems)
      .where(eq(shoppingItems.userId, userId))
      .orderBy(desc(shoppingItems.createdAt));

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching shopping items:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 