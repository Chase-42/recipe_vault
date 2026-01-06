import { getServerUserIdFromRequest } from "~/lib/auth-helpers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  AuthorizationError,
  handleApiError,
  ValidationError,
} from "~/lib/errors";
import { withRateLimit } from "~/lib/rateLimit";
import {
  updateShoppingItem,
  deleteShoppingItem,
} from "~/server/queries/shopping-list";

const updateItemSchema = z.object({
  checked: z.boolean(),
});

type UpdateItemRequest = z.infer<typeof updateItemSchema>;

// Rate limiter for individual item operations
const itemRateLimiter = {
  maxRequests: 100,
  windowMs: 60 * 1000,
  path: "/api/shopping-lists/items/[id]",
};

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      const params = await context.params;
      try {
        const userId = await getServerUserIdFromRequest(req);

        const itemId = Number.parseInt(params.id);
        if (isNaN(itemId)) {
          throw new ValidationError("Invalid item ID");
        }

        const body = (await req.json()) as UpdateItemRequest;
        const { checked } = updateItemSchema.parse(body);

        const updatedItem = await updateShoppingItem(userId, itemId, checked);

        return NextResponse.json(updatedItem);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ValidationError("Invalid request data");
        }
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    itemRateLimiter
  );
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      const params = await context.params;
      try {
        const userId = await getServerUserIdFromRequest(req);

        const itemId = Number.parseInt(params.id);
        if (isNaN(itemId)) {
          throw new ValidationError("Invalid item ID");
        }

        await deleteShoppingItem(userId, itemId);
        return new NextResponse(null, { status: 204 });
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    itemRateLimiter
  );
}
