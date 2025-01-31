import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { getRecipe, updateRecipe } from "../../../../server/queries";
import type { Recipe } from "~/types";
import { validateId, validateUpdateRecipe, type UpdateRecipeInput } from "~/lib/validation";
import { AuthorizationError, NotFoundError, ValidationError, handleApiError } from "~/lib/errors";
import { headers } from "next/headers";

// Cache duration in seconds
const CACHE_DURATION = 60; // 1 minute

export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const { userId } = getAuth(request);
		if (!userId) {
			throw new AuthorizationError();
		}

		const id = validateId(params.id);
		const body = await request.json() as UpdateRecipeInput;
		
		// Validate and sanitize the update data
		const validatedData = validateUpdateRecipe(body);

		if (Object.keys(validatedData).length === 0) {
			throw new ValidationError("No valid fields provided for update");
		}

		const updatedRecipe = await updateRecipe(id, validatedData);
		
		// Revalidate the cache for this recipe
		const headersList = headers();
		const host = headersList.get("host") ?? "";
		const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
		await fetch(`${protocol}://${host}/api/revalidate?path=/recipes/${id}`);
		
		return NextResponse.json(updatedRecipe);
	} catch (error) {
		const { error: errorMessage, statusCode } = handleApiError(error);
		return NextResponse.json({ error: errorMessage }, { status: statusCode });
	}
}

function sanitizeUpdateData(body: Partial<Recipe>): Partial<Recipe> {
	const updateData: Partial<Recipe> = {};

	const stringFields = [
		"name",
		"link",
		"imageUrl",
		"ingredients",
		"instructions",
	] as const;
	for (const field of stringFields) {
		if (body[field] !== undefined) {
			updateData[field] = body[field]?.trim();
		}
	}

	if (body.favorite !== undefined) {
		updateData.favorite = !!body.favorite;
	}

	return updateData;
}

export async function GET(req: NextRequest) {
	try {
		const { userId } = getAuth(req);
		if (!userId) {
			throw new AuthorizationError();
		}

		const url = new URL(req.url);
		const id = Number.parseInt(url.pathname.split("/").pop() ?? "");

		if (Number.isNaN(id)) {
			throw new ValidationError("Invalid ID");
		}

		const recipe = await getRecipe(id);
		if (!recipe) {
			throw new NotFoundError("Recipe not found");
		}

		// Add cache headers
		const response = NextResponse.json(recipe);
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
