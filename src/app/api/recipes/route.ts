import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "../../../server/db/index";
import { recipes } from "../../../server/db/schema";
import { uploadImage } from "../../../utils/uploadImage";
import { getMyRecipes } from "~/server/queries";
import { dynamicBlurDataUrl } from "~/utils/dynamicBlurDataUrl";
import type { RecipeDetails } from "~/types";
import { fetchRecipeDetails } from "~/utils/scraper";

const baseUrl =
	process.env.NODE_ENV === "development"
		? "http://localhost:3000/"
		: process.env.NEXT_PUBLIC_DOMAIN;

const flaskApiUrl = (link: string) =>
	`${baseUrl}api/scraper?url=${encodeURIComponent(link)}`;

const fetchDataFromFlask = async (link: string): Promise<RecipeDetails> => {
	const response = await fetch(flaskApiUrl(link));
	if (!response.ok) {
		const errorText = await response.text();
		console.error(`Flask API responded with an error: ${errorText}`);
		throw new Error("Failed to fetch data from Flask API");
	}
	const data = (await response.json()) as RecipeDetails;
	return data;
};

export async function POST(req: NextRequest) {
	try {
		const { userId } = getAuth(req);
		if (!userId) {
			return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
			});
		}

		const { link } = (await req.json()) as { link: string };
		if (!link || typeof link !== "string") {
			return new NextResponse(
				JSON.stringify({ error: "Invalid link or name" }),
				{
					status: 400,
				},
			);
		}

		const data = await fetchDataFromFlask(link);
		let { imageUrl, instructions, ingredients, name } = data;

		if (!name || !imageUrl || !instructions || !ingredients) {
			console.log("Falling back to alternative scraping");
			const fallbackData = await fetchRecipeDetails(link);
			imageUrl = imageUrl || fallbackData.imageUrl;
			instructions = instructions || fallbackData.instructions;
			ingredients = ingredients || fallbackData.ingredients;
		}

		const uploadedImageUrl = await uploadImage(imageUrl);
		const blurDataURL = await dynamicBlurDataUrl(uploadedImageUrl);

		const [recipe] = await db
			.insert(recipes)
			.values({
				link,
				imageUrl: uploadedImageUrl,
				blurDataUrl: blurDataURL,
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
			{
				status: 500,
			},
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
		const recipes = await getMyRecipes();
		return NextResponse.json(recipes);
	} catch (error) {
		console.error(error);
		return new NextResponse(
			JSON.stringify({ error: "Failed to fetch recipes" }),
			{
				status: 500,
			},
		);
	}
}
