import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { getRecipe, updateRecipe } from "../../../../server/queries";
import type { Recipe } from "~/types";

export async function PUT(req: NextRequest) {
	try {
		const { userId } = getAuth(req);
		if (!userId) {
			return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
			});
		}

		const { id, name, instructions, ingredients, favorite, imageUrl } =
			(await req.json()) as Recipe;

		if (!id || typeof id !== "number") {
			return new NextResponse(JSON.stringify({ error: "Invalid ID" }), {
				status: 400,
			});
		}

		await updateRecipe(id, {
			name: name ?? "",
			instructions: instructions ?? "",
			ingredients: ingredients ?? "",
			favorite: favorite ?? false,
			imageUrl: imageUrl ?? "",
		});

		return NextResponse.json({ message: "Recipe updated successfully" });
	} catch (error) {
		console.error("Failed to update recipe:", error);
		return new NextResponse(
			JSON.stringify({ error: "Failed to update recipe" }),
			{ status: 500 },
		);
	}
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
