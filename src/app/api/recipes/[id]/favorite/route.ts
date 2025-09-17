import { getAuth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import {
  AuthorizationError,
  handleApiError,
  NotFoundError,
  ValidationError,
} from "~/lib/errors";
import { withRateLimit } from "~/lib/rateLimit";
import { db } from "~/server/db";
import { recipes } from "~/server/db/schema";

const favoriteRateLimiter = {
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
  path: "/api/recipes/favorite",
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRateLimit(
    request,
    async (request: NextRequest): Promise<NextResponse> => {
      try {
        const { userId } = getAuth(request);
        if (!userId) {
          throw new AuthorizationError();
        }

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
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    favoriteRateLimiter
  );
}
