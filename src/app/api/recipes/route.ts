import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "../../../server/db/index";
import { recipes } from "../../../server/db/schema";
import { deleteRecipe, getMyRecipes } from "~/server/queries";
import { AuthorizationError, ValidationError, RecipeError, handleApiError } from "~/lib/errors";
import { flaskApiService } from "~/services/flaskApiService";
import { recipeProcessingService } from "~/services/recipeProcessingService";

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

		// Get data from Flask API
		const recipeData = await flaskApiService.fetchDataFromFlask(link);
		
		try {
			const processedData = await recipeProcessingService.processRecipeData(recipeData, link);

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
			console.log('Failed to process recipe data:', error);
			throw new RecipeError("Failed to extract complete recipe data", 422);
		}
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