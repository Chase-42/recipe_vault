import { getAuth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AuthorizationError,
  handleApiError,
  NotFoundError,
  ValidationError,
} from "~/lib/errors";
import {
  deleteShoppingItem,
  updateShoppingItem,
} from "~/server/queries/shopping-list";

const updateItemSchema = z.object({
  checked: z.boolean(),
});

type UpdateItemRequest = z.infer<typeof updateItemSchema>;

// Update an item (toggle checked status)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      throw new AuthorizationError();
    }

    const { itemId: itemIdParam } = await params;
    const itemId = Number.parseInt(itemIdParam);
    if (Number.isNaN(itemId)) {
      throw new ValidationError("Invalid item ID");
    }

    const body = (await req.json()) as UpdateItemRequest;
    const { checked } = updateItemSchema.parse(body);

    const updatedItem = await updateShoppingItem(userId, itemId, checked);
    if (!updatedItem) {
      throw new NotFoundError("Item not found");
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Invalid request data");
    }
    const { error: errorMessage, statusCode } = handleApiError(error);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

// Delete an item
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      throw new AuthorizationError();
    }

    const { itemId: itemIdParam } = await params;
    const itemId = Number.parseInt(itemIdParam);
    if (Number.isNaN(itemId)) {
      throw new ValidationError("Invalid item ID");
    }

    const deletedItem = await deleteShoppingItem(userId, itemId);
    if (!deletedItem) {
      throw new NotFoundError("Item not found");
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const { error: errorMessage, statusCode } = handleApiError(error);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
