import { getServerUserIdFromRequest } from "~/lib/auth-helpers";
import { and, eq, sql } from "drizzle-orm";
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getServerUserIdFromRequest(request);

    const { id: idParam } = await params;
    const id = Number(idParam);
    if (Number.isNaN(id)) {
      throw new ValidationError("Invalid ID");
    }

    // Optimized: Toggle favorite in a single operation and return the new value
    const [result] = await db
      .update(recipes)
      .set({
        favorite: sql`NOT ${recipes.favorite}`,
      })
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
      .returning({ favorite: recipes.favorite });

    if (!result) {
      throw new NotFoundError("Recipe not found");
    }

    return NextResponse.json({ favorite: result.favorite });
  } catch (error) {
    const { error: errorMessage, statusCode } = handleApiError(error);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
