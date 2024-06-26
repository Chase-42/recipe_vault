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
		.replace(/comments?.*$/i, "")
		.replace(/ratings?.*$/i, "")
		.replace(/reply?.*$/i, "")
		.replace(/•\s+/g, "• ")
		.replace(/^\s*•/gm, "•")
		.replace(/•/g, "")
		.replace(/^\s*▢/gm, "")
		.replace(
			/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+/gu,
			"",
		)
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
	const instructions = new Set<string>();
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
				instructions.add(text);
			}
		});
	}

	if (instructions.size === 0) {
		$('div[class*="instruction"], div[class*="step"], ol li, ul li').each(
			(_, elem) => {
				const text = extractText($(elem), $);
				if (text) {
					instructions.add(text);
				}
			},
		);
	}

	return Array.from(instructions).join("\n").trim();
};

const filterIngredients = ($: cheerio.Root): string[] => {
	const ingredients = new Set<string>();
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
				ingredients.add(text);
			}
		});
	}

	if (ingredients.size === 0) {
		$('div[class*="ingredient"], ul li, ol li').each((_, elem) => {
			const text = cleanText($(elem).text());
			if (text) {
				ingredients.add(text);
			}
		});
	}

	const cleanedIngredients = Array.from(ingredients);

	// Remove any overly long entries that are likely concatenated duplicates
	const maxIngredientLength = 200; // Adjust this value as needed
	const filteredIngredients = cleanedIngredients.filter(
		(ingredient) => ingredient.length <= maxIngredientLength,
	);

	return filteredIngredients;
};

export const fetchRecipeDetails = async (
	link: string,
): Promise<RecipeDetails> => {
	const response = await fetch(link);
	const html = await response.text();
	const $ = cheerio.load(html);

	// Remove unwanted elements
	$(
		'*[class*="comment"], *[id*="comment"], *[class*="comments"], *[id*="comments"], *[class*="ratings"], *[id*="ratings"], *[class*="reply"], *[id*="reply"], *[class*="replies"], *[id*="replies"]',
	).remove();
	$(
		"footer, .footer, .site-footer, .site-header, nav, .nav, .navbar, header, .header",
	).remove();

	const imageUrl =
		$('meta[property="og:image"], meta[name="twitter:image"]').attr(
			"content",
		) ?? "";
	console.log("imageUrl", imageUrl);

	const instructions = filterInstructions($);
	const ingredients = filterIngredients($);

	return {
		imageUrl,
		instructions,
		ingredients,
	};
};
