import { NextResponse, type NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { getShoppingItems } from "~/server/queries/shopping-list";

// We no longer need to create shopping lists since we have one list per user
export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const items = await getShoppingItems(userId);

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching shopping items:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 