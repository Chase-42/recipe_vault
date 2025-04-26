import { getAuth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { type CreateRecipeInput, validateCreateRecipe } from "~/lib/validation";
import { db } from "~/server/db";
import { recipes } from "~/server/db/schema";
import type { APIResponse, Recipe } from "~/types";
import { dynamicBlurDataUrl } from "~/utils/dynamicBlurDataUrl";

export async function POST(
  req: NextRequest
): Promise<NextResponse<APIResponse<Recipe>>> {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as CreateRecipeInput;
    const validatedData = validateCreateRecipe(body);

    const blurDataUrl = await dynamicBlurDataUrl(validatedData.imageUrl);

    const [recipe] = await db
      .insert(recipes)
      .values({
        ...validatedData,
        blurDataUrl,
        userId,
      })
      .returning();

    return NextResponse.json({ data: recipe as Recipe });
  } catch (error) {
    console.error("Recipe creation failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to save recipe";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
