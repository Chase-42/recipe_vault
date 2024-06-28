import * as cheerio from "cheerio";

interface RecipeDetails {
	imageUrl: string;
	instructions: string;
	ingredients: string[];
}

const cleanText = (text: string): string => {
	return text
		.replace(/\s+/g, " ") 
		.replace(/[\r\n\t]+/g, " ") 
		.replace(/please enable targetting cookies.*$/, "") 
		.replace(/if \(window\.innerWidth.*\{.*\}\);/g, "") 
		.replace(/propertag\.cmd\.push\(function\(\) \{.*\}\);/g, "") 
		.replace(/<.*?>/g, "") 
		.replace(/^\s*$/g, "") 
		.replace(/ingredients?\s*:\s*/i, "") 
		.replace(/instructions?\s*:\s*/i, "") 
		.replace(/tips?\s*:\s*/i, "") 
		.replace(/methods?\s*:\s*/i, "") 
		.replace(/•\s+/g, "• ") 
		.replace(/^\s*•/gm, "•") 
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
	$(
		"footer, .footer, .site-footer, .site-header, nav, .nav, .navbar, header, .header",
	).remove();

	const imageUrl =
		$('meta[property="og:image"], meta[name="twitter:image"]').attr(
			"content",
		) ?? "";

	const instructions = filterInstructions($);
	const ingredients = filterIngredients($);

	return {
		imageUrl,
		instructions,
		ingredients,
	};
};
