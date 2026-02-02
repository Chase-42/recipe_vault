import { getServerUserIdFromRequest } from "~/lib/auth-helpers";
import type { NextRequest, NextResponse } from "next/server";
import {
  NotFoundError,
  ValidationError,
  handleApiError,
} from "~/lib/errors";
import { z } from "zod";
import { validateId, validateUpdateRecipe } from "~/lib/validation";
import { getRecipe, updateRecipe } from "~/server/queries";
import { getOrSetCorrelationId } from "~/lib/request-context";
import { validateRequestBody } from "~/lib/middleware/validate-request";
import type { UpdateRecipeInput } from "~/types";
import { apiSuccess, apiError } from "~/lib/api-response";
import { schemas } from "~/lib/schemas";
import { withRateLimit } from "~/lib/rateLimit";
import { revalidatePath } from "next/cache";

const recipeIdRateLimiter = {
  maxRequests: 100,
  windowMs: 60 * 1000,
  path: "/api/recipes/[id]",
} as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return withRateLimit(
    request,
    async (req: NextRequest): Promise<NextResponse> => {
      getOrSetCorrelationId(req);
      try {
        // Validate authentication (userId used for auth check, not in update logic)
        await getServerUserIdFromRequest(req);

        const { id: idParam } = await params;
        const id = validateId(idParam);
        const updateData = (await validateRequestBody(
          req,
          schemas.updatedRecipe.partial().extend({ link: z.string().optional() })
        )) as UpdateRecipeInput;

        const validatedData = validateUpdateRecipe(updateData);

        if (Object.keys(validatedData).length === 0) {
          throw new ValidationError("No valid fields provided for update");
        }

        const updatedRecipe = await updateRecipe(id, validatedData, req);

        revalidatePath("/");
        revalidatePath(`/img/${id}`);

        const response = apiSuccess(updatedRecipe);
        response.headers.set(
          "Cache-Control",
          "no-cache, no-store, must-revalidate"
        );
        response.headers.set("Pragma", "no-cache");
        response.headers.set("Expires", "0");

        return response;
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return apiError(errorMessage, undefined, statusCode);
      }
    },
    recipeIdRateLimiter
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return withRateLimit(
    request,
    async (req: NextRequest): Promise<NextResponse> => {
      getOrSetCorrelationId(req);
      try {
        const userId = await getServerUserIdFromRequest(req);
        const { id: idParam } = await params;
        const id = Number.parseInt(idParam, 10);

        if (Number.isNaN(id)) {
          throw new ValidationError("Invalid ID");
        }

        const recipe = await getRecipe(id, userId);
        if (!recipe) {
          throw new NotFoundError("Recipe not found");
        }

        const response = apiSuccess(recipe);
        response.headers.set(
          "Cache-Control",
          "private, max-age=0, must-revalidate"
        );
        response.headers.set("X-Content-Type-Options", "nosniff");
        response.headers.set("Vary", "Accept-Encoding");

        return response;
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return apiError(errorMessage, undefined, statusCode);
      }
    },
    recipeIdRateLimiter
  );
}
