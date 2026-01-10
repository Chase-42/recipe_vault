import { getServerUserIdFromRequest } from "~/lib/auth-helpers";
import { type NextRequest, NextResponse } from "next/server";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
  handleApiError,
} from "~/lib/errors";
import { validateId, validateUpdateRecipe } from "~/lib/validation";
import { getRecipe, updateRecipe } from "~/server/queries";
import { getOrSetCorrelationId } from "~/lib/request-context";
import type { UpdateRecipeInput } from "~/types";
import { apiSuccess, apiError } from "~/lib/api-response";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  getOrSetCorrelationId(request);
  try {
    const userId = await getServerUserIdFromRequest(request);

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

    const response = apiSuccess(updatedRecipe);
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
    return apiError(errorMessage, undefined, statusCode);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // React Query handles caching, but allow browser to cache for short period
    // This helps with back/forward navigation while React Query manages freshness
    response.headers.set(
      "Cache-Control",
      "private, max-age=0, must-revalidate"
    );
    // Performance headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Vary", "Accept-Encoding");

    return response;
  } catch (error) {
    const { error: errorMessage, statusCode } = handleApiError(error);
    return apiError(errorMessage, undefined, statusCode);
  }
}
