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
	? "http://localhost:3000/" 
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
	new URL(`api/scraper?url=${encodeURIComponent(link)}`, baseUrl);

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
		const response: Response = await fetch(flaskApiUrl(link).toString(), {
			headers: { Accept: "application/json" },
			next: { revalidate: 0 },
		});

		const data = await response.json() as Record<string, unknown>;

		if (response.status === 422) {
			return {
				name: undefined,
				imageUrl: undefined,
				instructions: undefined,
				ingredients: undefined
			};
		}

		if (!response.ok) {
			throw new RecipeError(`Flask API error: ${JSON.stringify(data)}`, response.status);
		}

		return schemas.flaskApiResponse.parse(data);
	} catch (error) {
		if (error instanceof RecipeError) throw error;
		throw new RecipeError(`Failed to fetch recipe data: ${getErrorMessage(error)}`, 500);
	}
}

async function processRecipeData(
	flaskData: FlaskApiResponse,
	link: string,
): Promise<ProcessedData> {
	let { imageUrl, instructions, ingredients = [], name } = flaskData;
	const needsFallback = !name || !imageUrl || !instructions || !ingredients.length;



	if (needsFallback) {
		const [fallbackData, imageUrls] = await Promise.all([
			getRecipeData(link).catch(() => null as FallbackApiResponse | null),
			!imageUrl
				? fetchRecipeImages(link).catch(() => [] as string[])
				: Promise.resolve([] as string[]),
		]);



		name = name ?? sanitizeString(fallbackData?.name ?? "");
		imageUrl = imageUrl ?? fallbackData?.image?.url ?? imageUrls[0] ?? "";
		instructions = instructions ?? processInstructions(fallbackData?.recipeInstructions as RecipeStep[]);
		ingredients = ingredients.length > 0
			? ingredients
			: (fallbackData?.recipeIngredient ?? []).map(sanitizeString);


	}

	if (!imageUrl || !instructions || !ingredients.length || !name) {
		console.log('Validation failed:', {
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