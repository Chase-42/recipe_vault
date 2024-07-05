import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "../../../server/db/index";
import { recipes } from "../../../server/db/schema";
import { uploadImage } from "../../../utils/uploadImage";
import { getMyRecipes } from "~/server/queries";
import { dynamicBlurDataUrl } from "~/utils/dynamicBlurDataUrl";
import type { RecipeDetails, RecipeResponse } from "~/types";
import fetchRecipeImages, { fetchRecipeDetails } from "~/utils/scraper";
import getRecipeData from "@rethora/url-recipe-scraper";

const baseUrl =
	process.env.NODE_ENV === "development"
		? "http://localhost:3000/"
		: `${process.env.NEXT_PUBLIC_DOMAIN}/`; // Ensure trailing slash

const flaskApiUrl = (link: string): string =>
	`${baseUrl}api/scraper?url=${encodeURIComponent(link)}`;

const fetchDataFromFlask = async (link: string): Promise<RecipeDetails> => {
	try {
		const response: Response = await fetch(flaskApiUrl(link));
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`Flask API responded with an error: ${errorText}`);
			throw new Error("Failed to fetch data from Flask API");
		}
		const data = (await response.json()) as RecipeDetails;
		return data;
	} catch (error) {
		console.error("fetchDataFromFlask error:", error);
		throw error;
	}
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

		let data: RecipeDetails;
		try {
			data = await fetchDataFromFlask(link);
			console.log("data", data);
		} catch (error) {
			console.error("Error fetching data from Flask API:", error);
			throw new Error("Failed to fetch data from Flask API");
		}

		let { imageUrl, instructions, ingredients, name } = data;

		if (!name || !imageUrl || !instructions || !ingredients) {
			console.log("Falling back to alternative scraping");
			const fallbackData = (await getRecipeData(link)) as RecipeResponse;
			console.log("fallbackData", fallbackData);
			imageUrl = imageUrl || fallbackData.image.url;
			if (!imageUrl) {
				const imageUrls = await fetchRecipeImages(link);
				imageUrl = imageUrls.length > 0 ? imageUrls[0] : "";
			}
			instructions =
				instructions ||
				fallbackData.recipeInstructions
					.map((instruction) => instruction.text)
					.join("\n");
			ingredients = ingredients || fallbackData.recipeIngredient;
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
		console.error("Failed to save recipe:", error);
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
		console.error("Failed to fetch recipes:", error);
		return new NextResponse(
			JSON.stringify({ error: "Failed to fetch recipes" }),
			{
				status: 500,
			},
		);
	}
}
