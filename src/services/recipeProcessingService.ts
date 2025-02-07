import * as cheerio from 'cheerio';
import { type FlaskApiResponse, type ProcessedData } from "~/lib/schemas";
import { schemas } from "~/lib/schemas";
import { RecipeError } from "~/lib/errors";
import { getErrorMessage } from "~/lib/errors";
import fetchRecipeImages from "~/utils/scraper";
import getRecipeData from "@rethora/url-recipe-scraper";
import sanitizeString from "~/utils/sanitizeString";
import { uploadImage } from "~/utils/uploadImage";
import { dynamicBlurDataUrl } from "~/utils/dynamicBlurDataUrl";

// Types
interface RecipeStep {
    text?: string;
    '@type'?: string;
    name?: string;
    itemListElement?: RecipeStep[];
}

function cleanHtml(text: string): string {
    // Remove HTML tags and their contents if they're img tags
    text = text.replace(/<img[^>]*>/g, '');
    // Remove any remaining HTML tags but keep their contents
    text = text.replace(/<[^>]*>/g, '');
    // Remove multiple spaces and trim
    text = text.replace(/\s+/g, ' ').trim();
    // Remove srcset and sizes attributes and their values
    text = text.replace(/srcset="[^"]*"/g, '');
    text = text.replace(/sizes="[^"]*"/g, '');
    // Remove any "Instructions:" prefix
    text = text.replace(/^Instructions:\s*/i, '');
    // Remove any numbers at the start of the text (including multiple numbers)
    text = text.replace(/^(?:\d+\.?\s*)+/, '');
    // Remove any "Step X:" prefixes
    text = text.replace(/^Step\s+\d+:\s*/i, '');
    return text;
}

function processInstructions(instructions: RecipeStep[] = []): string {
    if (!Array.isArray(instructions)) return '';

    const allSteps: string[] = [];

    function extractSteps(step: RecipeStep) {
        if (typeof step === 'string') {
            const cleaned = cleanHtml(step);
            if (cleaned) allSteps.push(sanitizeString(cleaned));
            return;
        }

        if (typeof step === 'object' && step !== null) {
            if (step.text) {
                const cleaned = cleanHtml(step.text);
                if (cleaned) allSteps.push(sanitizeString(cleaned));
            }

            if (Array.isArray(step.itemListElement)) {
                step.itemListElement.forEach(extractSteps);
            }

            if (step['@type'] === 'HowToSection' && step.name) {
                const cleaned = cleanHtml(step.name);
                if (cleaned) allSteps.push(`${cleaned}:`);
            }
        }
    }

    try {
        instructions.forEach(extractSteps);
        return allSteps.filter(Boolean).join('\n');
    } catch (error) {
        console.log('Error processing instructions:', error);
        return '';
    }
}

async function scrapeWithCheerio(url: string): Promise<Partial<FlaskApiResponse>> {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const selectors = {
            name: [
                'h1.entry-title',
                '.recipe-title',
                '.wprm-recipe-name',
                'h1[itemprop="name"]',
                'h1'
            ],
            ingredients: [
                '.wprm-recipe-ingredients',
                '.ingredients',
                '[itemprop="recipeIngredient"]',
                '.ingredient-list'
            ],
            instructions: [
                '.wprm-recipe-instructions',
                '.instructions',
                '[itemprop="recipeInstructions"]',
                '.recipe-method'
            ]
        };

        let name;
        for (const selector of selectors.name) {
            const element = $(selector).first();
            if (element.length) {
                name = element.text().trim();
                break;
            }
        }

        let ingredients: string[] = [];
        for (const selector of selectors.ingredients) {
            const elements = $(selector).find('li');
            if (elements.length) {
                const rawIngredients = elements.map((_, el) => $(el).text().trim()).get() as string[];
                ingredients = rawIngredients.filter((text): text is string => 
                    typeof text === 'string' && text.length > 0
                );
                break;
            }
        }

        let instructions = '';
        for (const selector of selectors.instructions) {
            const elements = $(selector).find('li, p');
            if (elements.length > 0) {
                const steps = elements.map((_, el) => {
                    const text = cleanHtml($(el).html() ?? '');
                    return text || '';
                }).get() as string[];
                
                const validSteps = steps.filter((text): text is string => 
                    typeof text === 'string' && text.length > 0
                );
                instructions = validSteps.join('\n');
                break;
            }
        }

        const hasData = name !== undefined || ingredients.length > 0 || instructions !== '';
        if (hasData) {
            console.log('Cheerio scraper found:', {
                hasName: !!name,
                ingredientsCount: ingredients.length,
                hasInstructions: !!instructions
            });
            
            return { name, ingredients, instructions };
        }
    } catch (error) {
        console.log('Cheerio scraper error:', error);
    }
    
    return {};
}

async function processRecipeData(flaskData: FlaskApiResponse, link: string): Promise<ProcessedData> {
    let { imageUrl, instructions, ingredients = [], name } = flaskData;
    const needsFallback = !name || !imageUrl || !instructions || !ingredients.length;

    if (needsFallback) {
        try {
            // First try to get images since that's more reliable
            const imageUrls = !imageUrl
                ? await fetchRecipeImages(link).catch(() => [] as string[])
                : [];

            if (imageUrls.length > 0) {
                imageUrl = imageUrl ?? imageUrls[0];
                console.log('Found image URL from image scraper:', imageUrl);
            }

            // Try the fallback scraper
            try {
                const fallbackData = await getRecipeData(link);
                if (fallbackData) {
                    if (!name && fallbackData.name) {
                        name = sanitizeString(fallbackData.name);
                    }

                    if (!imageUrl && fallbackData.image?.url) {
                        imageUrl = fallbackData.image.url;
                    }

                    if (!instructions && Array.isArray(fallbackData.recipeInstructions)) {
                        instructions = processInstructions(
                            fallbackData.recipeInstructions.map(instruction => {
                                if (typeof instruction === 'string') return { text: instruction };
                                return instruction;
                            })
                        );
                    }

                    if ((!ingredients || ingredients.length === 0) && Array.isArray(fallbackData.recipeIngredient)) {
                        ingredients = fallbackData.recipeIngredient.map(sanitizeString);
                    }
                }
            } catch (fallbackError: unknown) {
                console.log('Fallback scraper error:', getErrorMessage(fallbackError));
            }

            // Try direct HTML scraping as last resort
            if (!name || !instructions || ingredients.length === 0) {
                const cheerioData = await scrapeWithCheerio(link);
                
                if (!name && cheerioData.name) {
                    name = sanitizeString(cheerioData.name);
                }
                
                if (!instructions && cheerioData.instructions) {
                    instructions = cheerioData.instructions;
                }
                
                if ((!ingredients || ingredients.length === 0) && cheerioData.ingredients?.length) {
                    ingredients = cheerioData.ingredients.map(sanitizeString);
                }
            }
        } catch (error) {
            console.log('Error in processRecipeData:', error);
        }
    }

    if (!imageUrl || !instructions || !ingredients.length || !name) {
        throw new RecipeError("Failed to extract complete recipe data", 422);
    }

    return processValidData({
        name,
        imageUrl,
        instructions,
        ingredients,
    });
}

async function processValidData(data: {
    name: string;
    imageUrl: string;
    instructions: string;
    ingredients: string[];
}): Promise<ProcessedData> {
    const [uploadedImageUrl, blurDataURL] = await Promise.all([
        uploadImage(data.imageUrl).catch(() => {
            throw new RecipeError("Failed to upload image", 500);
        }),
        dynamicBlurDataUrl(data.imageUrl).catch(() => {
            throw new RecipeError("Failed to generate blur URL", 500);
        }),
    ]);

    const processed = {
        ...data,
        imageUrl: uploadedImageUrl,
        blurDataURL,
    };

    return schemas.processedData.parse(processed);
}

export const recipeProcessingService = {
    processRecipeData,
    scrapeWithCheerio,
    processInstructions,
    cleanHtml,
}; 