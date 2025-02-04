import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { recipes } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Get current favorite status
    const [recipe] = await db
      .select({ favorite: recipes.favorite })
      .from(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)));

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Toggle favorite
    await db
      .update(recipes)
      .set({ favorite: !recipe.favorite })
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)));

    return NextResponse.json({ favorite: !recipe.favorite });
  } catch (error) {
    console.error("Failed to toggle favorite:", error);
    return NextResponse.json(
      { error: "Failed to update recipe" },
      { status: 500 }
    );
  }
} 