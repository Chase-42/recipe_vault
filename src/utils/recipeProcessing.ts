import { uploadImage } from "./uploadImage";
import { dynamicBlurDataUrl } from "./dynamicBlurDataUrl";
import { schemas, type ProcessedData, type FlaskApiResponse } from "~/lib/schemas";
import fetchRecipeImages from "./scraper";
import sanitizeString from "./sanitizeString";
import { RecipeError } from "~/lib/errors";

export async function processRecipeData(
  data: FlaskApiResponse,
  link: string,
): Promise<ProcessedData> {
  let { imageUrl } = data;
  const { instructions: rawInstructions, ingredients = [], name: rawName } = data;
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
    dynamicBlurDataUrl(imageUrl)
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