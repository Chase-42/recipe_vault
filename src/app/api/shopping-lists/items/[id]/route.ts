import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ValidationError } from "~/lib/errors";
import { withApiHandler } from "~/lib/api-handler";
import { validateRequestBody } from "~/lib/middleware/validate-request";
import {
  updateShoppingItem,
  deleteShoppingItem,
} from "~/server/queries/shopping-list";
import { apiSuccess } from "~/lib/api-response";

const updateItemSchema = z.object({
  checked: z.boolean(),
});

const itemRateLimiter = {
  maxRequests: 100,
  windowMs: 60 * 1000,
  path: "/api/shopping-lists/items/[id]",
};

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params;
  return withApiHandler(itemRateLimiter, async (req, userId) => {
    const itemId = Number.parseInt(id);
    if (isNaN(itemId)) throw new ValidationError("Invalid item ID");
    const { checked } = await validateRequestBody(req, updateItemSchema);
    return apiSuccess(await updateShoppingItem(userId, itemId, checked));
  })(req);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params;
  return withApiHandler(itemRateLimiter, async (_req, userId) => {
    const itemId = Number.parseInt(id);
    if (isNaN(itemId)) throw new ValidationError("Invalid item ID");
    await deleteShoppingItem(userId, itemId);
    return apiSuccess({ id: itemId }, 200);
  })(req);
}
