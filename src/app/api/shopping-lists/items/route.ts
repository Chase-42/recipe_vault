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
  addShoppingItems,
  batchUpdateShoppingItems,
} from "~/server/queries/shopping-list";

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
  try {
    const userId = await getServerUserIdFromRequest(req);

    const body = (await req.json()) as AddItemsRequest;
    const { items } = addItemsSchema.parse(body);

    const newItems = await addShoppingItems(userId, items);

    return NextResponse.json({ success: true, items: newItems });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Invalid request data");
    }
    const { error: errorMessage, statusCode } = handleApiError(error);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = await getServerUserIdFromRequest(req);

        const body = (await req.json()) as BatchUpdateRequest;
        const { itemIds, checked } = batchUpdateSchema.parse(body);

        if (itemIds.length === 0) {
          return NextResponse.json({ success: true, items: [] });
        }

        const updatedItems = await batchUpdateShoppingItems(
          userId,
          itemIds,
          checked
        );

        return NextResponse.json({ success: true, items: updatedItems });
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
    batchRateLimiter
  );
}
