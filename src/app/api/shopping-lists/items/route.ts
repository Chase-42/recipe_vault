import { getAuth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = (await req.json()) as AddItemsRequest;
    const { items } = addItemsSchema.parse(body);

    const newItems = await addShoppingItems(userId, items);

    return NextResponse.json({ success: true, items: newItems });
  } catch (error) {
    console.error("Error adding items to shopping list:", error);
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
