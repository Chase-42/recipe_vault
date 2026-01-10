import { getServerUserIdFromRequest } from "~/lib/auth-helpers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  AuthorizationError,
  handleApiError,
  ValidationError,
} from "~/lib/errors";
import { withRateLimit } from "~/lib/rateLimit";
import { getOrSetCorrelationId } from "~/lib/request-context";
import { validateRequestBody } from "~/lib/middleware/validate-request";
import {
  addShoppingItems,
  batchUpdateShoppingItems,
} from "~/server/queries/shopping-list";
import { apiSuccess, apiError } from "~/lib/api-response";

const addItemsSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      recipeId: z.number(),
    })
  ),
});

const batchUpdateSchema = z.object({
  itemIds: z.array(z.number().int().positive()),
  checked: z.boolean(),
});

type AddItemsRequest = z.infer<typeof addItemsSchema>;
type BatchUpdateRequest = z.infer<typeof batchUpdateSchema>;

// Rate limiter for batch operations
const batchRateLimiter = {
  maxRequests: 50,
  windowMs: 60 * 1000,
  path: "/api/shopping-lists/items",
};

export async function POST(req: NextRequest) {
  getOrSetCorrelationId(req);
  try {
    const userId = await getServerUserIdFromRequest(req);
    const { items } = await validateRequestBody(req, addItemsSchema);

    const newItems = await addShoppingItems(userId, items);

    return apiSuccess({ items: newItems }, 201);
  } catch (error) {
    const { error: errorMessage, statusCode } = handleApiError(error);
    return apiError(errorMessage, undefined, statusCode);
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      getOrSetCorrelationId(req);
      try {
        const userId = await getServerUserIdFromRequest(req);
        const { itemIds, checked } = await validateRequestBody(req, batchUpdateSchema);

        if (itemIds.length === 0) {
          return apiSuccess({ items: [] });
        }

        const updatedItems = await batchUpdateShoppingItems(
          userId,
          itemIds,
          checked
        );

        return apiSuccess({ items: updatedItems });
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return apiError(errorMessage, undefined, statusCode);
      }
    },
    batchRateLimiter
  );
}
