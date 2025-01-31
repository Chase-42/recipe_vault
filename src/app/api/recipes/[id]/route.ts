import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { getRecipe, updateRecipe } from "../../../../server/queries";
import type { Recipe } from "~/types";
import { validateId, validateUpdateRecipe, type UpdateRecipeInput } from "~/lib/validation";

export async function PUT(
	request: Request,
	{ params }: { params: { id: string } },
) {
	try {
		const id = validateId(params.id);
		const body = await request.json() as UpdateRecipeInput;
		
		// Validate and sanitize the update data
		const validatedData = validateUpdateRecipe(body);

		if (Object.keys(validatedData).length === 0) {
			return NextResponse.json(
				{ error: "No valid fields provided for update" },
				{ status: 400 },
			);
		}

		const updatedRecipe = await updateRecipe(id, validatedData);
		return NextResponse.json(updatedRecipe);
	} catch (error) {
		console.error("Failed to update recipe:", error);
		const message =
			error instanceof Error ? error.message : "Failed to update recipe";
		return NextResponse.json({ error: message }, { status: 400 });
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
			return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
			});
		}

		const url = new URL(req.url);
		const id = Number.parseInt(url.pathname.split("/").pop() ?? "");

		if (Number.isNaN(id)) {
			return new NextResponse(JSON.stringify({ error: "Invalid ID" }), {
				status: 400,
			});
		}

		const recipe = await getRecipe(id);

		if (!recipe) {
			return new NextResponse(JSON.stringify({ error: "Recipe not found" }), {
				status: 404,
			});
		}

		return NextResponse.json(recipe);
	} catch (error) {
		console.error("Failed to fetch recipe:", error);
		return new NextResponse(
			JSON.stringify({ error: "Failed to fetch recipe" }),
			{ status: 500 },
		);
	}
}
