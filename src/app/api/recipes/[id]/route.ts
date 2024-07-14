import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "../../../../server/db/index";
import { updateRecipe } from "../../../../server/queries";
import sanitizeString from "../../../../utils/sanitizeString";
import type { Recipe } from "~/types";

export async function PUT(req: NextRequest) {
	try {
		console.log("Request received for PUT /api/recipes/:id");
		const { userId } = getAuth(req);
		if (!userId) {
			return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
			});
		}

		const { id, name, instructions, ingredients } =
			(await req.json()) as Recipe;
		console.log("Request payload:", { id, name, instructions, ingredients });

		if (!id || typeof id !== "number") {
			return new NextResponse(JSON.stringify({ error: "Invalid ID" }), {
				status: 400,
			});
		}

		await updateRecipe(id, {
			name: name ?? "",
			instructions: instructions ?? "",
			ingredients: ingredients ?? "",
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
