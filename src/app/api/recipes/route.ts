import { type NextRequest, NextResponse } from "next/server";
import { recipes } from "../../../server/db/schema";
import { db } from "../../../server/db/index";
import { fetchRecipeDetails } from "../../../utils/scraper";
import { uploadImage } from "../../../utils/uploadImage";
import { auth, getAuth } from "@clerk/nextjs/server";
import { getMyRecipes } from "~/server/queries";

// POST handler
export async function POST(req: NextRequest) {
	try {
		const { userId } = getAuth(req);
		if (!userId) {
			return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
			});
		}

		const { link, name } = (await req.json()) as { link: string; name: string };
		if (
			!link ||
			typeof link !== "string" ||
			!name ||
			typeof name !== "string"
		) {
			return new NextResponse(
				JSON.stringify({ error: "Invalid link or name" }),
				{ status: 400 },
			);
		}

		const { imageUrl, instructions, ingredients } =
			await fetchRecipeDetails(link);
		const uploadedImageUrl = await uploadImage(imageUrl);

		const [recipe] = await db
			.insert(recipes)
			.values({
				link,
				imageUrl: uploadedImageUrl,
				instructions,
				ingredients: ingredients.join("\n"),
				name,
				userId,
			})
			.returning();

		return NextResponse.json(recipe);
	} catch (error) {
		console.error(error);
		return new NextResponse(
			JSON.stringify({ error: "Failed to save recipe" }),
			{ status: 500 },
		);
	}
}

// GET handler
export async function GET(req: NextRequest) {
	try {
		const { userId } = getAuth(req);
		if (!userId) {
			return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
			});
		}
		const recipes = await getMyRecipes();
		return NextResponse.json(recipes);
	} catch (error) {
		console.error(error);
		return new NextResponse(
			JSON.stringify({ error: "Failed to fetch recipes" }),
			{ status: 500 },
		);
	}
}
