import { getAuth } from "@clerk/nextjs/server";
import getRecipeData from "@rethora/url-recipe-scraper";
import { type NextRequest, NextResponse } from "next/server";
import {
  AuthorizationError,
  RecipeError,
  ValidationError,
  getErrorMessage,
  handleApiError,
} from "~/lib/errors";
import { withRateLimit } from "~/lib/rateLimit";
import { schemas } from "~/lib/schemas";
import { db } from "~/server/db";
import { recipes } from "~/server/db/schema";
import { deleteRecipe, getMyRecipes } from "~/server/queries";
import { dynamicBlurDataUrl } from "~/utils/dynamicBlurDataUrl";
import sanitizeString from "~/utils/sanitizeString";
import fetchRecipeImages from "~/utils/scraper";
import { uploadImage } from "~/utils/uploadImage";
import type {
  FallbackApiResponse,
  FlaskApiResponse,
  ProcessedData,
} from "~/types";
// import { z } from "zod";
// import { rateLimit } from "~/lib/rateLimit";
// import { processRecipeData } from "~/utils/recipeProcessing";
// import { scrapeRecipe } from "~/utils/scraper";
// import { validateUrl } from "~/lib/validation";

// Constants
const baseUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5328/"
    : `${process.env.NEXT_PUBLIC_DOMAIN}/`;

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 12;

// Types
interface RecipeStep {
  text?: string;
  "@type"?: string;
  name?: string;
  itemListElement?: RecipeStep[];
}

// Utility Functions
const flaskApiUrl = (link: string): URL =>
  new URL(`/api/scraper?url=${encodeURIComponent(link)}`, baseUrl);

function processInstructions(instructions: RecipeStep[] = []): string {
  const allSteps: string[] = [];

  const extractSteps = (step: RecipeStep): void => {
    if (step.text) {
      allSteps.push(sanitizeString(step.text));
    }
    step.itemListElement?.forEach(extractSteps);
  };

  instructions.forEach(extractSteps);
  return allSteps.filter(Boolean).join("\n");
}

// Data Processing Functions
async function fetchDataFromFlask(link: string): Promise<FlaskApiResponse> {
  try {
    const response = await fetch(flaskApiUrl(link).toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return schemas.flaskApiResponse.parse({});
    }

    const rawData: unknown = await response.json();
    const validatedData = schemas.flaskApiResponse.parse(rawData);

    const data = {
      name: validatedData.name ?? undefined,
      imageUrl: validatedData.imageUrl ?? undefined,
      instructions: validatedData.instructions ?? undefined,
      ingredients: validatedData.ingredients ?? undefined,
    };

    // Ensure ingredients is always an array
    const ingredients = Array.isArray(data.ingredients) ? data.ingredients : [];

    return data.name && data.instructions && ingredients.length > 0
      ? { ...data, ingredients }
      : schemas.flaskApiResponse.parse({});
  } catch {
    return schemas.flaskApiResponse.parse({});
  }
}

async function tryJsPackageScraper(
  link: string
): Promise<FallbackApiResponse | null> {
  try {
    const data = await getRecipeData(link);

    if (
      !data?.name ||
      !data?.recipeInstructions?.length ||
      !data?.recipeIngredient?.length
    ) {
      return null;
    }

    const transformedInstructions = data.recipeInstructions
      .map((instruction) => {
        if (typeof instruction === "string") {
          return { "@type": "HowToStep" as const, text: instruction };
        }
        if (
          typeof instruction === "object" &&
          instruction &&
          "text" in instruction
        ) {
          return {
            "@type": "HowToStep" as const,
            text: String(instruction.text ?? ""),
          };
        }
        return null;
      })
      .filter(
        (i): i is { "@type": "HowToStep"; text: string } =>
          i !== null && !!i.text
      );

    const validIngredients =
      data.recipeIngredient
        ?.map((ing) => (typeof ing === "string" ? ing : String(ing)))
        .filter(Boolean) ?? [];

    if (!transformedInstructions.length || !validIngredients.length) {
      return null;
    }

    return {
      name: data.name,
      image: { url: data.image?.url ?? "" },
      recipeInstructions: transformedInstructions,
      recipeIngredient: validIngredients,
    };
  } catch {
    return null;
  }
}

async function processRecipeData(
  flaskData: FlaskApiResponse,
  link: string
): Promise<ProcessedData> {
  let { imageUrl, instructions, ingredients = [], name } = flaskData;

  if (!name || !instructions || !ingredients.length) {
    const fallbackData = await tryJsPackageScraper(link);
    if (
      fallbackData?.name &&
      fallbackData?.recipeInstructions?.length &&
      fallbackData?.recipeIngredient?.length
    ) {
      name = sanitizeString(fallbackData.name);
      instructions = processInstructions(fallbackData.recipeInstructions);
      ingredients = fallbackData.recipeIngredient;
      imageUrl = fallbackData.image?.url ?? imageUrl;
    }
  }

  if (!imageUrl) {
    const imageUrls = await fetchRecipeImages(link);
    imageUrl = imageUrls[0];
  }

  if (!imageUrl || !instructions || !ingredients.length || !name) {
    throw new RecipeError("Failed to extract complete recipe data", 422);
  }

  const [uploadedImageUrl, blurDataURL] = await Promise.all([
    uploadImage(imageUrl),
    dynamicBlurDataUrl(imageUrl),
  ]).catch(() => {
    throw new RecipeError("Failed to process image", 500);
  });

  return schemas.processedData.parse({
    name,
    imageUrl: uploadedImageUrl,
    blurDataURL,
    instructions,
    ingredients,
  });
}

// Create a shared rate limiter instance for the recipes endpoint
const recipesRateLimiter = {
  maxRequests: 100,
  windowMs: 60 * 1000,
  path: "/api/recipes",
};

// API Route Handlers
export async function GET(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      try {
        const { userId } = getAuth(req);
        if (!userId) throw new AuthorizationError();

        const { searchParams } = new URL(req.url);
        const params = schemas.searchParamsSchema.parse({
          offset: Number(searchParams.get("offset")) ?? 0,
          limit: Number(searchParams.get("limit")) ?? DEFAULT_LIMIT,
          search: searchParams.get("search") ?? undefined,
          category: searchParams.get("category") ?? "All",
          sort: searchParams.get("sort") ?? "newest",
        });

        if (params.limit > MAX_LIMIT) {
          params.limit = MAX_LIMIT;
        }

        const { recipes, total } = await getMyRecipes(
          userId,
          { offset: params.offset, limit: params.limit },
          {
            searchQuery: params.search,
            category: params.category,
            sortBy: params.sort,
          }
        );

        const totalPages = Math.ceil(total / params.limit);
        const currentPage = Math.floor(params.offset / params.limit) + 1;

        const response = {
          recipes,
          pagination: {
            total,
            offset: params.offset,
            limit: params.limit,
            hasNextPage: currentPage < totalPages,
            hasPreviousPage: currentPage > 1,
            totalPages,
            currentPage,
          },
        };

        return NextResponse.json(response);
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    recipesRateLimiter
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      try {
        const { userId } = getAuth(req);
        if (!userId) throw new AuthorizationError();

        const body: unknown = await req.json();
        const { link } = body as { link?: string };
        if (!link?.trim()) throw new ValidationError("Valid link required");

        const recipeData = await fetchDataFromFlask(link).catch((error) => {
          throw new RecipeError(
            `Failed to extract recipe data: ${getErrorMessage(error)}`,
            422
          );
        });

        const processedData = await processRecipeData(recipeData, link);

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
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    recipesRateLimiter
  );
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      try {
        const { searchParams } = new URL(req.url);
        const id = Number(searchParams.get("id"));
        if (!id || Number.isNaN(id))
          throw new ValidationError("Valid recipe ID required");

        await deleteRecipe(id, req);

        return NextResponse.json({ success: true });
      } catch (error) {
        const { error: errorMessage, statusCode } = handleApiError(error);
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }
    },
    recipesRateLimiter
  );
}
