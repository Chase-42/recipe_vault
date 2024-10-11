import * as cheerio from "cheerio";

const fetchRecipeImages = async (link: string): Promise<string[]> => {
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

	const imageUrls = new Set<string>();

	// Extract images from meta tags
	$('meta[property="og:image"], meta[name="twitter:image"]').each((_, elem) => {
		const content = $(elem).attr("content");
		if (content) {
			imageUrls.add(content);
		}
	});

	// Extract images from img tags
	$("img").each((_, elem) => {
		const src = $(elem).attr("src");
		if (src) {
			imageUrls.add(src);
		}
	});

	return Array.from(imageUrls);
};

export default fetchRecipeImages;
