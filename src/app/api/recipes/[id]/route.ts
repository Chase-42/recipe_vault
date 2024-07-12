import { type NextRequest, NextResponse } from "next/server";
import { getRecipe } from "~/server/queries";

export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } },
) {
	const recipeId = Number(params.id);

	console.log("Fetching recipe with ID:", recipeId); // Debugging log

	if (Number.isNaN(recipeId)) {
		return new NextResponse(JSON.stringify({ error: "Invalid ID" }), {
			status: 400,
		});
	}

	const recipe = await getRecipe(recipeId);

	if (!recipe) {
		return new NextResponse(JSON.stringify({ error: "Recipe not found" }), {
			status: 404,
		});
	}

	return NextResponse.json(recipe);
}
