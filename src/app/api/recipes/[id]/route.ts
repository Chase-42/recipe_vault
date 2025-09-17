import { getAuth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
  handleApiError,
} from "~/lib/errors";
import { validateId, validateUpdateRecipe } from "~/lib/validation";
import { withRateLimit } from "~/lib/rateLimit";
import { getRecipe, updateRecipe } from "~/server/queries";
import type { UpdateRecipeInput } from "~/types";

// Rate limiter for recipe updates
const updateRecipeRateLimiter = {
  maxRequests: 20,
  windowMs: 60 * 1000, // 1 minute
  path: "/api/recipes/update",
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
        const id = validateId(idParam);
        const body: unknown = await request.json();
        const updateData = body as UpdateRecipeInput;

        // Validate and sanitize the update data
        const validatedData = validateUpdateRecipe(updateData);

        if (Object.keys(validatedData).length === 0) {
          throw new ValidationError("No valid fields provided for update");
        }

        const updatedRecipe = await updateRecipe(id, validatedData, request);

        const response = NextResponse.json(updatedRecipe);
        // Ensure no caching for update responses
        response.headers.set(
          "Cache-Control",
          "no-cache, no-store, must-revalidate"
        );
        response.headers.set("Pragma", "no-cache");
        response.headers.set("Expires", "0");

        return response;
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    updateRecipeRateLimiter
  );
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      throw new AuthorizationError();
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const idStr = pathParts[pathParts.length - 1] ?? "";
    const id = Number.parseInt(idStr);

    if (Number.isNaN(id)) {
      throw new ValidationError("Invalid ID");
    }

    const recipe = await getRecipe(id, userId);
    if (!recipe) {
      throw new NotFoundError("Recipe not found");
    }

    const response = NextResponse.json(recipe);
    // Ensure no caching for GET responses
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    const { error: errorMessage, statusCode } = handleApiError(error);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
