import { getServerUserIdFromRequest } from "~/lib/auth-helpers";
import { type NextRequest, NextResponse } from "next/server";
import { ValidationError, handleApiError } from "~/lib/errors";
import { withRateLimit } from "~/lib/rateLimit";
import { schemas } from "~/lib/schemas";
import { db } from "~/server/db";
import { recipes } from "~/server/db/schema";
import { deleteRecipe, getMyRecipes } from "~/server/queries";
import { logger } from "~/lib/logger";
import { getOrSetCorrelationId } from "~/lib/request-context";
import { validateUrl } from "~/lib/validation";
import { scrapeRecipe } from "~/utils/recipe-scrapers";
import { processRecipeData } from "~/utils/recipeProcessing";
import type { FlaskApiResponse } from "~/types";

// Constants
const FLASK_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5328/"
    : `${process.env.NEXT_PUBLIC_DOMAIN}/`;

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 12;

// Rate limiter configuration
const recipesRateLimiter = {
  maxRequests: 100,
  windowMs: 60 * 1000,
  path: "/api/recipes",
} as const;

// GET /api/recipes - Retrieves paginated recipes for the authenticated user
export async function GET(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      getOrSetCorrelationId(req);
      const log = logger.forComponent("RecipesAPI").forAction("GET");

      try {
        const userId = await getServerUserIdFromRequest(req);
        const { searchParams } = new URL(req.url);

        // Parse and validate search parameters
        const params = schemas.searchParamsSchema.parse({
          offset: Number(searchParams.get("offset")) ?? 0,
          limit: Number(searchParams.get("limit")) ?? DEFAULT_LIMIT,
          search: searchParams.get("search") ?? undefined,
          category: searchParams.get("category") ?? "All",
          sort: searchParams.get("sort") ?? "newest",
        });

        // Enforce max limit
        if (params.limit > MAX_LIMIT) {
          params.limit = MAX_LIMIT;
        }

        // Fetch recipes from database
        const { recipes: recipeList, total } = await getMyRecipes(
          userId,
          { offset: params.offset, limit: params.limit },
          {
            searchQuery: params.search,
            category: params.category,
            sortBy: params.sort,
          }
        );

        // Calculate pagination metadata
        const totalPages = Math.ceil(total / params.limit);
        const currentPage = Math.floor(params.offset / params.limit) + 1;

        return NextResponse.json({
          recipes: recipeList,
          pagination: {
            total,
            offset: params.offset,
            limit: params.limit,
            hasNextPage: currentPage < totalPages,
            hasPreviousPage: currentPage > 1,
            totalPages,
            currentPage,
          },
        });
      } catch (error) {
        log.error("Failed to fetch recipes", error as Error);
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

// POST /api/recipes - Creates a new recipe by scraping the provided URL
export async function POST(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      getOrSetCorrelationId(req);
      const log = logger.forComponent("RecipesAPI").forAction("POST");

      try {
        const userId = await getServerUserIdFromRequest(req);

        // Parse and validate request body
        const body: unknown = await req.json();
        const { link } = schemas.createRecipeRequest.parse(body);

        if (!link.trim()) {
          throw new ValidationError("Valid link required");
        }

        if (!validateUrl(link)) {
          throw new ValidationError("Invalid URL format");
        }

        log.debug("Scraping recipe", { link, userId });

        // Scrape recipe data from URL
        const scrapedData = await scrapeRecipe(link, FLASK_BASE_URL);

        // Process the scraped data (upload image, generate blur, etc.)
        const recipeData: FlaskApiResponse = {
          name: scrapedData.name,
          imageUrl: scrapedData.imageUrl ?? null,
          instructions: scrapedData.instructions,
          ingredients: scrapedData.ingredients,
        };

        const processedData = await processRecipeData(recipeData, link);

        // Insert recipe into database
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

        if (!recipe) {
          throw new Error("Failed to create recipe - no data returned");
        }

        log.info("Recipe created successfully", { recipeId: recipe.id, link });

        return NextResponse.json({ data: recipe });
      } catch (error) {
        log.error("Failed to create recipe", error as Error);
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

// DELETE /api/recipes?id=<recipeId> - Deletes a recipe by ID
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  return withRateLimit(
    req,
    async (req: NextRequest): Promise<NextResponse> => {
      getOrSetCorrelationId(req);
      const log = logger.forComponent("RecipesAPI").forAction("DELETE");

      try {
        const { searchParams } = new URL(req.url);
        const idParam = searchParams.get("id");

        if (!idParam) {
          throw new ValidationError("Recipe ID is required");
        }

        const id = Number(idParam);
        if (!id || Number.isNaN(id) || id <= 0) {
          throw new ValidationError("Valid recipe ID required");
        }

        await deleteRecipe(id, req);

        log.info("Recipe deleted successfully", { recipeId: id });

        return NextResponse.json({ success: true });
      } catch (error) {
        log.error("Failed to delete recipe", error as Error);
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
