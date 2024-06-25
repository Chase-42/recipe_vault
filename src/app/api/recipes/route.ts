import { type NextRequest, NextResponse } from "next/server";
import { recipes } from "../../../server/db/schema";
import { db } from "../../../server/db/index";
import * as cheerio from "cheerio";
import { uploadImage } from "../../../utils/uploadImage";
import { getAuth } from "@clerk/nextjs/server";

// Define the structure for recipe details
interface RecipeDetails {
	imageUrl: string;
	instructions: string;
}

// Function to fetch recipe details from a given link
const fetchRecipeDetails = async (link: string): Promise<RecipeDetails> => {
	const response = await fetch(link);
	const html = await response.text();
	const $ = cheerio.load(html);

	const imageUrl = $('meta[property="og:image"]').attr("content") || "";
	const instructions = $("div.instructions").text() || "";

	return { imageUrl, instructions };
};

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

		const { imageUrl, instructions } = await fetchRecipeDetails(link);
		const uploadedImageUrl = await uploadImage(imageUrl);

		const [recipe] = await db
			.insert(recipes)
			.values({
				link,
				imageUrl: uploadedImageUrl,
				instructions,
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
export async function GET() {
	try {
		const recipeList = await db.select().from(recipes);
		return NextResponse.json(recipeList);
	} catch (error) {
		console.error(error);
		return new NextResponse(
			JSON.stringify({ error: "Failed to fetch recipes" }),
			{ status: 500 },
		);
	}
}
