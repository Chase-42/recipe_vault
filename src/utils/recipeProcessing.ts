import { RecipeError } from "~/lib/errors";
import { schemas } from "~/lib/schemas";
import type { FlaskApiResponse, ProcessedData } from "~/types";
import { dynamicBlurDataUrl } from "./dynamicBlurDataUrl";
import sanitizeString from "./sanitizeString";
import fetchRecipeImages from "./scraper";
import { uploadImage } from "./uploadImage";

export async function processRecipeData(
  data: FlaskApiResponse,
  link: string
): Promise<ProcessedData> {
  let { imageUrl } = data;
  const {
    instructions: rawInstructions,
    ingredients = [],
    name: rawName,
  } = data;
  const name = sanitizeString(rawName);
  const instructions = sanitizeString(rawInstructions);

  if (!imageUrl) {
    const imageUrls = await fetchRecipeImages(link);
    imageUrl = imageUrls[0];
  }

  if (!imageUrl || !instructions || !ingredients.length || !name) {
    throw new RecipeError("Failed to extract complete recipe data", 422);
  }

  const [uploadedImageUrl, blurDataURL] = await Promise.all([
    uploadImage(imageUrl),
    dynamicBlurDataUrl(imageUrl),
  ]).catch(() => {
    throw new RecipeError("Failed to process image", 500);
  });

  return schemas.processedData.parse({
    name,
    imageUrl: uploadedImageUrl,
    blurDataURL,
    instructions,
    ingredients: ingredients.map(sanitizeString),
  });
}
