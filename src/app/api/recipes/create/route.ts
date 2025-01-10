import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { recipes } from "~/server/db/schema";
import { dynamicBlurDataUrl } from "~/utils/dynamicBlurDataUrl";
import type { CreateRecipeRequest, Recipe, APIResponse } from "~/types";



export async function POST(
  req: NextRequest
): Promise<NextResponse<APIResponse<Recipe>>> {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json() as CreateRecipeRequest;
    
    const { name, link, imageUrl, ingredients, instructions } = body;
    
    if (!name?.trim() || !link?.trim() || !imageUrl?.trim() || 
        !ingredients?.trim() || !instructions?.trim()) {
      return NextResponse.json(
        { error: "All fields are required and must not be empty" },
        { status: 400 }
      );
    }

    const blurDataUrl = await dynamicBlurDataUrl(imageUrl);

    const [recipe] = await db
      .insert(recipes)
      .values({
        name,
        link,
        imageUrl,
        blurDataUrl,
        instructions,
        ingredients,
        userId,
        favorite: false,
      })
      .returning();

    return NextResponse.json({ data: recipe as Recipe });

  } catch (error) {
    console.error("Recipe creation failed:", error);
    const message = error instanceof Error ? error.message : "Failed to save recipe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}