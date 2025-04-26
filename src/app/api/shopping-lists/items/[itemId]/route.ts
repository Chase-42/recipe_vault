import { getAuth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
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
  { params }: { params: { itemId: string } }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const itemId = Number.parseInt(params.itemId);
    if (Number.isNaN(itemId)) {
      return new NextResponse("Invalid item ID", { status: 400 });
    }

    const body = (await req.json()) as UpdateItemRequest;
    const { checked } = updateItemSchema.parse(body);

    const updatedItem = await updateShoppingItem(userId, itemId, checked);
    if (!updatedItem) {
      return new NextResponse("Item not found", { status: 404 });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating shopping item:", error);
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Delete an item
export async function DELETE(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const itemId = Number.parseInt(params.itemId);
    if (Number.isNaN(itemId)) {
      return new NextResponse("Invalid item ID", { status: 400 });
    }

    const deletedItem = await deleteShoppingItem(userId, itemId);
    if (!deletedItem) {
      return new NextResponse("Item not found", { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting shopping item:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
