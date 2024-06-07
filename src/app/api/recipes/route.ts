// src/app/api/recipes/route.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { recipes } from "../../../server/db/schema";
import { db } from "../../../server/db/index";
import * as cheerio from "cheerio";
import { uploadImage } from "../../../utils/uploadImage";

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

// Main handler function for the API route
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method === "POST") {
		try {
			// Extract and validate the link from the request body
			const { link } = req.body as { link: string };
			if (!link || typeof link !== "string") {
				return res.status(400).json({ error: "Invalid link" });
			}

			// Fetch recipe details from the provided link
			const { imageUrl, instructions } = await fetchRecipeDetails(link);

			// Upload the image and get the URL
			const uploadedImageUrl = await uploadImage(imageUrl);

			// Insert the recipe details into the database
			const [recipe] = await db
				.insert(recipes)
				.values({
					link,
					imageUrl: uploadedImageUrl,
					instructions,
				})
				.returning();

			// Respond with the newly created recipe
			return res.status(200).json(recipe);
		} catch (error) {
			console.error(error);
			return res.status(500).json({ error: "Failed to save recipe" });
		}
	} else if (req.method === "GET") {
		try {
			// Fetch all recipes from the database
			const recipeList = await db.select().from(recipes);
			return res.status(200).json(recipeList);
		} catch (error) {
			console.error(error);
			return res.status(500).json({ error: "Failed to fetch recipes" });
		}
	} else {
		res.setHeader("Allow", ["POST", "GET"]);
		return res.status(405).end(`Method ${req.method} Not Allowed`);
	}
};

export default handler;
