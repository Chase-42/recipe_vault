import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { recipes } from "~/server/db/schema";
import { uploadImage } from "~/utils/uploadImage";
import { deleteRecipe, getMyRecipes } from "~/server/queries";
import { dynamicBlurDataUrl } from "~/utils/dynamicBlurDataUrl";
import { schemas, type ProcessedData, type FlaskApiResponse, type FallbackApiResponse } from "~/lib/schemas";
import fetchRecipeImages from "~/utils/scraper";
import getRecipeData from "@rethora/url-recipe-scraper";
import sanitizeString from "~/utils/sanitizeString";
import { AuthorizationError, ValidationError, RecipeError, handleApiError, getErrorMessage } from "~/lib/errors";
import { withRateLimit } from "~/lib/rateLimit";

// Constants
const baseUrl = process.env.NODE_ENV === "development" 
	? "http://localhost:5328/" 
	: `${process.env.NEXT_PUBLIC_DOMAIN}/`;

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 12;

// Types
interface RecipeStep {
	text?: string;
	'@type'?: string;
	name?: string;
	itemListElement?: RecipeStep[];
}

interface RawFlaskResponse {
	name?: string;
	image?: string;
	imageUrl?: string;
	instructions?: string;
	ingredients?: string[];
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
	return allSteps.filter(Boolean).join('\n');
}

// Data Processing Functions
async function fetchDataFromFlask(link: string): Promise<FlaskApiResponse> {
	try {
		const response = await fetch(flaskApiUrl(link).toString(), {
			headers: { Accept: "application/json" },
			next: { revalidate: 0 },
		});

		if (!response.ok) {
			return {} as FlaskApiResponse;
		}

		const rawData = (await response.json()) as RawFlaskResponse;

		const data = {
			name: rawData.name ?? undefined,
			imageUrl: rawData.image ?? rawData.imageUrl ?? undefined,
			instructions: rawData.instructions ?? undefined,
			ingredients: Array.isArray(rawData.ingredients) ? rawData.ingredients : undefined
		};

		return data.name && data.instructions && data.ingredients?.length 
			? data 
			: {} as FlaskApiResponse;
	} catch {
		return {} as FlaskApiResponse;
	}
}

async function tryJsPackageScraper(link: string): Promise<FallbackApiResponse | null> {
	try {
		const data = await getRecipeData(link);

		if (!data?.name || !data?.recipeInstructions?.length || !data?.recipeIngredient?.length) {
			return null;
		}

		const transformedInstructions = data.recipeInstructions
			.map(instruction => {
				if (typeof instruction === 'string') {
					return { "@type": "HowToStep" as const, text: instruction };
				}
				if (typeof instruction === 'object' && instruction && 'text' in instruction) {
					return { "@type": "HowToStep" as const, text: String(instruction.text ?? '') };
				}
				return null;
			})
			.filter((i): i is { "@type": "HowToStep"; text: string } => i !== null && !!i.text);

		const validIngredients = data.recipeIngredient
			?.map(ing => typeof ing === 'string' ? ing : String(ing))
			.filter(Boolean) ?? [];

		if (!transformedInstructions.length || !validIngredients.length) {
			return null;
		}

		return {
			name: data.name,
			image: { url: data.image?.url ?? '' },
			recipeInstructions: transformedInstructions,
			recipeIngredient: validIngredients
		};
	} catch {
		return null;
	}
}

async function processRecipeData(
	flaskData: FlaskApiResponse,
	link: string,
): Promise<ProcessedData> {
	let { imageUrl, instructions, ingredients = [], name } = flaskData;
	
	if (!name || !instructions || !ingredients.length) {
		const fallbackData = await tryJsPackageScraper(link);
		if (fallbackData?.name && fallbackData?.recipeInstructions?.length && fallbackData?.recipeIngredient?.length) {
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
		dynamicBlurDataUrl(imageUrl)
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
const recipesRateLimiter = { maxRequests: 100, windowMs: 60 * 1000, path: "/api/recipes" };

// API Route Handlers
export async function GET(req: NextRequest): Promise<NextResponse> {
	return withRateLimit(req, async (req: NextRequest): Promise<NextResponse> => {
		try {
			const { userId } = getAuth(req);
			if (!userId) throw new AuthorizationError();

			const url = new URL(req.url);
			const offset = Math.max(Number(url.searchParams.get("offset")) ?? 0, 0);
			const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) ?? DEFAULT_LIMIT, 1), MAX_LIMIT);

			console.log('API Request:', { userId, offset, limit });

			const { recipes: recipeList, total } = await getMyRecipes(userId, offset, limit);
			console.log('API Response:', { recipeList, total });

			const response = NextResponse.json({
				recipes: recipeList,
				pagination: {
					total,
					offset,
					limit,
					hasNextPage: total > offset + limit,
					hasPreviousPage: offset > 0,
					totalPages: Math.ceil(total / limit),
					currentPage: Math.floor(offset / limit) + 1,
				},
			});

			response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
			return response;
		} catch (error) {
			const { error: errorMessage, statusCode } = handleApiError(error);
			return NextResponse.json({ error: errorMessage }, { status: statusCode });
		}
	}, recipesRateLimiter);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
	return withRateLimit(req, async (req: NextRequest): Promise<NextResponse> => {
		try {
			const { userId } = getAuth(req);
			if (!userId) throw new AuthorizationError();

			const { link } = (await req.json()) as { link?: string };
			if (!link?.trim()) throw new ValidationError("Valid link required");

			const recipeData = await fetchDataFromFlask(link).catch((error) => {
				throw new RecipeError(`Failed to extract recipe data: ${getErrorMessage(error)}`, 422);
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
			return NextResponse.json({ error: errorMessage }, { status: statusCode });
		}
	}, recipesRateLimiter);
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
	return withRateLimit(req, async (req: NextRequest): Promise<NextResponse> => {
		try {
			const { userId } = getAuth(req);
			if (!userId) throw new AuthorizationError();

			const id = new URL(req.url).searchParams.get("id");
			if (!id) throw new ValidationError("Invalid ID");

			await deleteRecipe(Number(id));
			return NextResponse.json({ message: "Recipe deleted successfully" });
		} catch (error) {
			const { error: errorMessage, statusCode } = handleApiError(error);
			return NextResponse.json({ error: errorMessage }, { status: statusCode });
		}
	}, recipesRateLimiter);
}