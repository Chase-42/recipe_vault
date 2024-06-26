import * as cheerio from "cheerio";

interface RecipeDetails {
	imageUrl: string;
	instructions: string;
	ingredients: string[];
}

const cleanText = (text: string): string => {
	return text
		.replace(/\s+/g, " ") // Replace multiple spaces with a single space
		.replace(/[\r\n\t]+/g, " ") // Replace newlines and tabs with a space
		.replace(/please enable targetting cookies.*$/, "") // Remove unwanted text
		.replace(/if \(window\.innerWidth.*\{.*\}\);/g, "") // Remove inline scripts
		.replace(/propertag\.cmd\.push\(function\(\) \{.*\}\);/g, "") // Remove inline ads
		.replace(/<.*?>/g, "") // Remove HTML tags
		.replace(/^\s*$/g, "") // Remove empty lines
		.replace(/ingredients?\s*:\s*/i, "") // Remove leading "Ingredients:" text
		.replace(/instructions?\s*:\s*/i, "") // Remove leading "Instructions:" text
		.replace(/tips?\s*:\s*/i, "") // Remove leading "Tips:" text
		.replace(/methods?\s*:\s*/i, "") // Remove leading "Method:" text
		.replace(/•\s+/g, "• ") // Clean up bullet points
		.replace(/^\s*•/gm, "•") // Ensure bullet points are at the start of the line
		.trim();
};

const extractText = ($elem: cheerio.Cheerio, $: cheerio.Root): string => {
	let text = "";
	$elem.contents().each((_, elem) => {
		if (elem.type === "text") {
			text += $(elem).text();
		} else if (elem.type === "tag") {
			text += ` ${$(elem).text()}`;
		}
	});
	return cleanText(text);
};

const filterInstructions = ($: cheerio.Root): string => {
	let instructions = "";
	const instructionSelectors = [
		"div.instructions",
		"ol.instructions",
		".recipe-instructions",
		".method-instructions",
		".directions",
		".steps",
		".step",
		".instruction",
		".wprm-recipe-instructions-container",
		"div.wprm-recipe-instructions",
		"div.wprm-recipe-instructions-container",
		"div.directions",
		"div.steps",
		"div.instructions",
		".directions-list",
		".step",
		".instruction",
		"li.step",
		"li.direction",
		"ol.steps li",
		"ol.directions li",
		"ol.instructions li",
		"div.wprm-recipe-instructions",
		"div.wprm-recipe-instructions-container",
		"div.wprm-recipe-instruction-text",
		"div.tasty-recipe-instructions",
		"div.yumprint-recipe-instructions",
	];

	for (const selector of instructionSelectors) {
		$(selector).each((_, elem) => {
			const text = extractText($(elem), $);
			if (text) {
				instructions += `${text}\n`;
			}
		});
	}

	if (!instructions) {
		// Try more generic selectors if no instructions found
		instructions = $(
			'div[class*="instruction"], div[class*="step"], ol li, ul li',
		)
			.map((_, elem) => `${cleanText($(elem).text())}`)
			.get()
			.join("\n");
	}

	return instructions.trim();
};

const filterIngredients = ($: cheerio.Root): string[] => {
	const ingredients: string[] = [];
	const ingredientSelectors = [
		"ul.ingredients li",
		"div.ingredients li",
		".ingredient",
		".recipe-ingredients li",
		".ingredients-item",
		".ingredient-item",
		".ingredient",
		".ingredient-list",
		".wprm-recipe-ingredient",
		"ul.wprm-recipe-ingredients li",
		"li.wprm-recipe-ingredient",
		"ul.ingredients",
		"div.ingredient",
		".ingredients li",
		"li.ingredient",
		".ingredients-item",
		"li.ingredients-item",
		"div.ingredient",
		"ul.ingredient-list li",
		"li.ingredient-list-item",
		"ul.wprm-recipe-ingredients",
		"li.wprm-recipe-ingredient",
		"div.tasty-recipe-ingredients",
		"div.yumprint-recipe-ingredients",
	];

	for (const selector of ingredientSelectors) {
		$(selector).each((_, elem) => {
			const text = extractText($(elem), $);
			if (text) {
				ingredients.push(`${cleanText(text)}`);
			}
		});
	}

	if (ingredients.length === 0) {
		// Try more generic selectors if no ingredients found
		$('div[class*="ingredient"], ul li, ol li').each((_, elem) => {
			const text = cleanText($(elem).text());
			if (text) {
				ingredients.push(`${text}`);
			}
		});
	}

	return ingredients;
};

export const fetchRecipeDetails = async (
	link: string,
): Promise<RecipeDetails> => {
	const response = await fetch(link);
	const html = await response.text();
	const $ = cheerio.load(html);

	// Remove footer and other unwanted sections
	$(
		"footer, .footer, .site-footer, .site-header, nav, .nav, .navbar, header, .header",
	).remove();

	const imageUrl =
		$('meta[property="og:image"], meta[name="twitter:image"]').attr(
			"content",
		) || "";

	const instructions = filterInstructions($);
	const ingredients = filterIngredients($);

	return {
		imageUrl,
		instructions,
		ingredients,
	};
};
