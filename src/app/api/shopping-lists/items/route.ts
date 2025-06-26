import { getAuth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  AuthorizationError,
  handleApiError,
  ValidationError,
} from "~/lib/errors";
import { addShoppingItems } from "~/server/queries/shopping-list";

const addItemsSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      recipeId: z.number(),
    })
  ),
});

type AddItemsRequest = z.infer<typeof addItemsSchema>;

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      throw new AuthorizationError();
    }

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
