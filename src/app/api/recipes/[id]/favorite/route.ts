import { getAuth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import {
  AuthorizationError,
  handleApiError,
  NotFoundError,
  ValidationError,
} from "~/lib/errors";
import { db } from "~/server/db";
import { recipes } from "~/server/db/schema";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      throw new AuthorizationError();
    }

    const id = Number(params.id);
    if (Number.isNaN(id)) {
      throw new ValidationError("Invalid ID");
    }

    // Get current favorite status
    const [recipe] = await db
      .select({ favorite: recipes.favorite })
      .from(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)));

    if (!recipe) {
      throw new NotFoundError("Recipe not found");
    }

    // Toggle favorite
    await db
      .update(recipes)
      .set({ favorite: !recipe.favorite })
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)));

    return NextResponse.json({ favorite: !recipe.favorite });
  } catch (error) {
    const { error: errorMessage, statusCode } = handleApiError(error);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
