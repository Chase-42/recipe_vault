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
import { AuthorizationError, NotFoundError, ValidationError, RecipeError, handleApiError, getErrorMessage } from "~/lib/errors";

const baseUrl =
	process.env.NODE_ENV === "development"
		? "http://localhost:3000/"
		: `${process.env.NEXT_PUBLIC_DOMAIN}/`;

const flaskApiUrl = (link: string): string =>
	`${baseUrl}api/scraper?url=${encodeURIComponent(link)}`;

async function fetchDataFromFlask(link: string): Promise<RecipeDetails> {
	const response = await fetch(flaskApiUrl(link), {
		headers: { Accept: "application/json" },
		next: { revalidate: 0 },
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
		.map((instruction) => sanitizeString(instruction?.text ?? ""))
		.filter(Boolean)
		.join("\n");
}

async function processRecipeData(
	flaskData: RecipeDetails,
	link: string,
): Promise<ProcessedData> {
	let { imageUrl, instructions, ingredients, name } = flaskData;

	const needsFallback =
		!name || !imageUrl || !instructions || !ingredients?.length;

	if (needsFallback) {
		const [fallbackData, imageUrls] = await Promise.all([
			getRecipeData(link).catch(() => null as RecipeResponse | null),
			!imageUrl
				? fetchRecipeImages(link).catch(() => [] as string[])
				: Promise.resolve([] as string[]),
		]);

		name = name ?? sanitizeString(fallbackData?.name ?? "");
		imageUrl = imageUrl ?? fallbackData?.image?.url ?? imageUrls[0] ?? "";
		instructions =
			instructions ??
			processInstructions(
				fallbackData?.recipeInstructions as InstructionLike[],
			);
		ingredients =
			ingredients?.length > 0
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
		}),
	]);

	return {
		name,
		imageUrl: uploadedImageUrl,
		instructions,
		ingredients,
		blurDataURL,
	};
}

// Cache duration in seconds
const CACHE_DURATION = 30; // 30 seconds for list view

export async function GET(req: NextRequest) {
	try {
		const { userId } = getAuth(req);
		if (!userId) {
			throw new AuthorizationError();
		}

		const url = new URL(req.url);
		const offset = Number(url.searchParams.get("offset")) || 0;
		const limit = Number(url.searchParams.get("limit")) || 12;

		// Ensure reasonable limits
		const safeLimitedLimit = Math.min(Math.max(limit, 1), 100);
		const safeOffset = Math.max(offset, 0);

		const { recipes: recipeList, total } = await getMyRecipes(
			userId,
			safeOffset,
			safeLimitedLimit,
		);

		// Calculate pagination metadata
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

		// Add cache headers
		response.headers.set(
			"Cache-Control",
			`public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`
		);

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

		let recipeData: RecipeDetails;
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
