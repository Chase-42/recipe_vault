import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "../../../server/db/index";
import { recipes } from "../../../server/db/schema";
import { uploadImage } from "../../../utils/uploadImage";
import { deleteRecipe, getMyRecipes } from "~/server/queries";
import { dynamicBlurDataUrl } from "~/utils/dynamicBlurDataUrl";
import { schemas, type ProcessedData, type FlaskApiResponse, type FallbackApiResponse } from "~/lib/schemas";
import fetchRecipeImages from "~/utils/scraper";
import getRecipeData from "@rethora/url-recipe-scraper";
import sanitizeString from "~/utils/sanitizeString";
import { AuthorizationError, ValidationError, RecipeError, handleApiError, getErrorMessage } from "~/lib/errors";

// Constants
const baseUrl = process.env.NODE_ENV === "development" 
	? "http://localhost:5328/" 
	: `${process.env.NEXT_PUBLIC_DOMAIN}/`;


// Types
interface RecipeStep {
	text?: string;
	'@type'?: string;
	name?: string;
	itemListElement?: RecipeStep[];
}

// Utility Functions
const flaskApiUrl = (link: string): URL => 
	new URL(`/api/scraper?url=${encodeURIComponent(link)}`, baseUrl);

function processInstructions(instructions: RecipeStep[] = []): string {
	if (!instructions?.length) return '';

	const allSteps: string[] = [];

	function extractSteps(step: RecipeStep) {
		if (step.text) {
			allSteps.push(sanitizeString(step.text));
		}
		if (step.itemListElement?.length) {
			step.itemListElement.forEach(extractSteps);
		}
	}

	instructions.forEach(extractSteps);
	return allSteps.filter(Boolean).join('\n');
}

// Data Processing Functions
async function fetchDataFromFlask(link: string): Promise<FlaskApiResponse> {
	try {
		console.log('Trying Python scraper...');
		const response: Response = await fetch(flaskApiUrl(link).toString(), {
			headers: { Accept: "application/json" },
			next: { revalidate: 0 },
		});

		if (!response.ok) {
			console.log('Python scraper failed with status:', response.status);
			return {
				name: undefined,
				imageUrl: undefined,
				instructions: undefined,
				ingredients: undefined
			};
		}

		const rawData = await response.json();
		console.log('Python scraper raw response:', rawData);

		// Handle potential null/undefined values
		const data = {
			name: rawData.name || undefined,
			imageUrl: rawData.image || rawData.imageUrl || undefined,
			instructions: rawData.instructions || undefined,
			ingredients: Array.isArray(rawData.ingredients) ? rawData.ingredients : undefined
		};

		// Only return data if we have ALL required fields
		if (data.name && data.instructions && data.ingredients?.length) {
			console.log('Python scraper succeeded with data');
			return data;
		}

		console.log('Python scraper returned incomplete data:', data);
		return {
			name: undefined,
			imageUrl: undefined,
			instructions: undefined,
			ingredients: undefined
		};
	} catch (error) {
		console.log('Python scraper error:', error);
		return {
			name: undefined,
			imageUrl: undefined,
			instructions: undefined,
			ingredients: undefined
		};
	}
}

async function tryJsPackageScraper(link: string): Promise<FallbackApiResponse | null> {
	try {
		console.log('Trying JS package scraper...');
		const data = await getRecipeData(link);

		// Validate all required fields exist
		if (!data?.name || !data?.recipeInstructions?.length || !data?.recipeIngredient?.length) {
			console.log('JS package returned incomplete data');
			return null;
		}

		// Transform instructions to match our schema, safely handling potential errors
		const transformedInstructions = data.recipeInstructions
			.map(instruction => {
				if (typeof instruction === 'string') {
					return {
						"@type": "HowToStep" as const,
						text: instruction
					};
				}
				if (typeof instruction === 'object' && instruction && 'text' in instruction) {
					return {
						"@type": "HowToStep" as const,
						text: String(instruction.text || '')
					};
				}
				return null;
			})
			.filter((i): i is { "@type": "HowToStep"; text: string } => i !== null && !!i.text);

		// Filter out any undefined ingredients and convert to strings
		const validIngredients = (data.recipeIngredient || [])
			.map(ing => typeof ing === 'string' ? ing : String(ing))
			.filter(Boolean);

		if (!transformedInstructions.length || !validIngredients.length) {
			console.log('JS package data validation failed');
			return null;
		}

		// Get image URL from data
		const imageUrl = data.image?.url || '';

		const validatedData: FallbackApiResponse = {
			name: data.name,
			image: { url: imageUrl },
			recipeInstructions: transformedInstructions,
			recipeIngredient: validIngredients
		};

		console.log('JS package scraper succeeded');
		return validatedData;
	} catch (error) {
		console.log('JS package scraper error:', error);
		return null;
	}
}

async function tryCustomScraper(link: string): Promise<string[]> {
	try {
		console.log('Trying custom image scraper...');
		const imageUrls = await fetchRecipeImages(link);
		console.log('Custom scraper found images:', imageUrls.length);
		return imageUrls;
	} catch (error) {
		console.log('Custom scraper error:', error);
		return [];
	}
}

async function processRecipeData(
	flaskData: FlaskApiResponse,
	link: string,
): Promise<ProcessedData> {
	// Try Python scraper data first
	let { imageUrl, instructions, ingredients = [], name } = flaskData;
	let needsFallback = !name || !imageUrl || !instructions || !ingredients.length;

	// If Python scraper failed, try JS package
	if (needsFallback) {
		console.log('Python data incomplete, trying JS package...');
		const fallbackData = await tryJsPackageScraper(link);
		if (fallbackData?.name && fallbackData?.recipeInstructions?.length && fallbackData?.recipeIngredient?.length) {
			name = sanitizeString(fallbackData.name);
			instructions = processInstructions(fallbackData.recipeInstructions);
			ingredients = fallbackData.recipeIngredient;
			
			// If JS package found an image, use it
			if (fallbackData.image?.url) {
				imageUrl = fallbackData.image.url;
				needsFallback = false;
			}
		}
	}

	// If we still need an image, try custom image scraper
	if (!imageUrl) {
		console.log('No image found, trying custom image scraper...');
		const imageUrls = await tryCustomScraper(link);
		if (imageUrls.length > 0) {
			imageUrl = imageUrls[0];
		}
	}

	if (!imageUrl || !instructions || !ingredients.length || !name) {
		console.log('All scrapers failed. Validation errors:', {
			hasImage: !!imageUrl,
			hasInstructions: !!instructions,
			ingredientsLength: ingredients.length,
			hasName: !!name
		});
		throw new RecipeError("Failed to extract complete recipe data", 422);
	}

	return processValidData({
		name,
		imageUrl,
		instructions,
		ingredients,
	});
}

async function processValidData(data: {
	name: string;
	imageUrl: string;
	instructions: string;
	ingredients: string[];
}): Promise<ProcessedData> {
	const [uploadedImageUrl, blurDataURL] = await Promise.all([
		uploadImage(data.imageUrl).catch(() => {
			throw new RecipeError("Failed to upload image", 500);
		}),
		dynamicBlurDataUrl(data.imageUrl).catch(() => {
			throw new RecipeError("Failed to generate blur URL", 500);
		}),
	]);

	const processed = {
		...data,
		imageUrl: uploadedImageUrl,
		blurDataURL,
	};

	return schemas.processedData.parse(processed);
}

// API Route Handlers
export async function GET(req: NextRequest) {
	try {
		const { userId } = getAuth(req);
		if (!userId) {
			throw new AuthorizationError();
		}

		const url = new URL(req.url);
		const offset = Number(url.searchParams.get("offset")) || 0;
		const limit = Number(url.searchParams.get("limit")) || 12;

		const safeLimitedLimit = Math.min(Math.max(limit, 1), 100);
		const safeOffset = Math.max(offset, 0);

		const { recipes: recipeList, total } = await getMyRecipes(
			userId,
			safeOffset,
			safeLimitedLimit,
		);

		const hasNextPage = total > safeOffset + safeLimitedLimit;
		const hasPreviousPage = safeOffset > 0;
		const totalPages = Math.ceil(total / safeLimitedLimit);
		const currentPage = Math.floor(safeOffset / safeLimitedLimit) + 1;

		const response = NextResponse.json({
			recipes: recipeList,
			pagination: {
				total,
				offset: safeOffset,
				limit: safeLimitedLimit,
				hasNextPage,
				hasPreviousPage,
				totalPages,
				currentPage,
			},
		});

		response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
		response.headers.set('Pragma', 'no-cache');
		response.headers.set('Expires', '0');

		return response;
	} catch (error) {
		const { error: errorMessage, statusCode } = handleApiError(error);
		return NextResponse.json({ error: errorMessage }, { status: statusCode });
	}
}

export async function POST(req: NextRequest) {
	try {
		const { userId } = getAuth(req);
		if (!userId) {
			throw new AuthorizationError();
		}

		const { link } = (await req.json()) as { link?: string };
		if (!link?.trim()) {
			throw new ValidationError("Valid link required");
		}

		let recipeData: FlaskApiResponse;
		try {
			recipeData = await fetchDataFromFlask(link);
		} catch (error: unknown) {
			throw new RecipeError(`Failed to extract recipe data: ${getErrorMessage(error)}`, 422);
		}

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
}

export async function DELETE(req: NextRequest) {
	try {
		const { userId } = getAuth(req);
		if (!userId) {
			throw new AuthorizationError();
		}

		const url = new URL(req.url);
		const id = url.searchParams.get("id");
		if (!id) {
			throw new ValidationError("Invalid ID");
		}

		await deleteRecipe(Number(id));
		return NextResponse.json(
			{ message: "Recipe deleted successfully" },
			{ status: 200 },
		);
	} catch (error) {
		const { error: errorMessage, statusCode } = handleApiError(error);
		return NextResponse.json({ error: errorMessage }, { status: statusCode });
	}
}