import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "../../../server/db/index";
import { recipes } from "../../../server/db/schema";
import { uploadImage } from "../../../utils/uploadImage";
import { deleteRecipe, getMyRecipes } from "~/server/queries";
import { dynamicBlurDataUrl } from "~/utils/dynamicBlurDataUrl";
import type { RecipeDetails, RecipeResponse } from "~/types";
import fetchRecipeImages from "~/utils/scraper";
import getRecipeData from "@rethora/url-recipe-scraper";
import sanitizeString from "~/utils/sanitizeString";

const baseUrl = process.env.NODE_ENV === "development"
  ? "http://localhost:3000/"
  : `${process.env.NEXT_PUBLIC_DOMAIN}/`;

const flaskApiUrl = (link: string): string =>
  `${baseUrl}api/scraper?url=${encodeURIComponent(link)}`;

async function fetchDataFromFlask(link: string): Promise<RecipeDetails> {
  const response = await fetch(flaskApiUrl(link), {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 0 }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Flask API error: ${errorText}`);
  }
  
  return response.json() as Promise<RecipeDetails>;
}

interface ProcessedData {
  name: string;
  imageUrl: string;
  instructions: string;
  ingredients: string[];
  blurDataURL: string;
}

interface InstructionLike {
  text?: string;
}

function processInstructions(instructions: InstructionLike[] = []): string {
  return instructions
    .map(instruction => sanitizeString(instruction?.text ?? ""))
    .filter(Boolean)
    .join("\n");
}

async function processRecipeData(
  flaskData: RecipeDetails,
  link: string
): Promise<ProcessedData> {
  let { imageUrl, instructions, ingredients, name } = flaskData;

  const needsFallback = !name || !imageUrl || !instructions || !ingredients?.length;
  
  if (needsFallback) {
    const [fallbackData, imageUrls] = await Promise.all([
      getRecipeData(link).catch(() => null as RecipeResponse | null),
      !imageUrl 
        ? fetchRecipeImages(link).catch(() => [] as string[]) 
        : Promise.resolve([] as string[])
    ]);

    name = name ?? sanitizeString(fallbackData?.name ?? "");
    imageUrl = imageUrl ?? fallbackData?.image?.url ?? (imageUrls[0] ?? "");
    instructions = instructions ?? processInstructions(fallbackData?.recipeInstructions as InstructionLike[]);
    ingredients = ingredients?.length > 0
      ? ingredients
      : (fallbackData?.recipeIngredient ?? []).map(sanitizeString);
  }

  if (!imageUrl || !instructions || !ingredients?.length || !name) {
    throw new Error("Failed to extract complete recipe data");
  }

  const [uploadedImageUrl, blurDataURL] = await Promise.all([
    uploadImage(imageUrl).catch(() => {
      throw new Error("Failed to upload image");
    }),
    dynamicBlurDataUrl(imageUrl).catch(() => {
      throw new Error("Failed to generate blur URL");
    })
  ]);

  return {
    name,
    imageUrl: uploadedImageUrl,
    instructions,
    ingredients,
    blurDataURL
  };
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { link } = await req.json() as { link?: string };
    if (!link?.trim()) {
      return NextResponse.json(
        { error: "Valid link required" },
        { status: 400 }
      );
    }

    const flaskData = await fetchDataFromFlask(link);
    const processedData = await processRecipeData(flaskData, link);

    const [recipe] = await db
      .insert(recipes)
      .values({
        link,
        imageUrl: processedData.imageUrl,
        blurDataUrl: processedData.blurDataURL,
        instructions: processedData.instructions,
        ingredients: processedData.ingredients.join("\n"),
        name: processedData.name,
        userId,
      })
      .returning();

    return NextResponse.json(recipe);

  } catch (error) {
    console.error("Recipe processing failed:", error);
    const message = error instanceof Error ? error.message : "Failed to save recipe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    let cursor = Number(url.searchParams.get("cursor")) || 0;
    let limit = Number(url.searchParams.get("limit")) || 5;

    limit = Math.min(Math.max(limit, 1), 100);
    cursor = Math.max(cursor, 0);

    const fetchedRecipes = await getMyRecipes(userId, cursor, limit);
    const nextCursor = fetchedRecipes.length === limit ? cursor + limit : null;

    return NextResponse.json({
      recipes: fetchedRecipes,
      nextCursor,
    });
  } catch (error) {
    console.error("Failed to fetch recipes:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await deleteRecipe(Number(id));
    return NextResponse.json(
      { message: "Recipe deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to delete recipe:", error);
    return NextResponse.json(
      { error: "Failed to delete recipe" },
      { status: 500 },
    );
  }
}