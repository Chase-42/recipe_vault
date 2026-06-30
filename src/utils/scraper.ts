import * as cheerio from "cheerio";
import type { FallbackApiResponse } from "~/types";
import { fetchWithTimeout } from "./fetchWithTimeout";

const FETCH_TIMEOUT_MS = 10_000; // 10 seconds

// Browser-like headers to avoid 403 blocks from recipe sites.
// Keep in sync with api/index.py:BROWSER_HEADERS — Python adds
// Accept-Encoding/Connection which fetch handles automatically here.
const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  DNT: "1",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Cache-Control": "max-age=0",
};

export const fetchRecipeImages = async (link: string): Promise<string[]> => {
  try {
    const response = await fetchWithTimeout(
      link,
      { headers: BROWSER_HEADERS },
      FETCH_TIMEOUT_MS
    );
    if (!response.ok) {
      return [];
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    $(
      '*[class*="comment"], *[id*="comment"], *[class*="comments"], *[id*="comments"], *[class*="ratings"], *[id*="ratings"], *[class*="reply"], *[id*="reply"], *[class*="replies"], *[id*="replies"]'
    ).remove();
    $(
      "footer, .footer, .site-footer, .site-header, nav, .nav, .navbar, header, .header"
    ).remove();

    const imageUrls = new Set<string>();

    $('meta[property="og:image"], meta[name="twitter:image"]').each(
      (_, elem) => {
        const content = $(elem).attr("content");
        if (content) {
          imageUrls.add(content);
        }
      }
    );

    $("img").each((_, elem) => {
      const src = $(elem).attr("src");
      if (src) {
        imageUrls.add(src);
      }
    });

    return Array.from(imageUrls);
  } catch (error) {
    // Silently fail - this is a fallback operation
    return [];
  }
};

function extractCleanText($elem: cheerio.Cheerio): string {
  $elem
    .find("img, script, style, noscript, iframe, svg, picture, source")
    .remove();
  $elem
    .find(
      '[class*="image"], [class*="img"], [class*="photo"], [class*="picture"], [itemprop="image"]'
    )
    .remove();

  return $elem.text().replace(/\s+/g, " ").trim();
}

function extractRecipeName($: ReturnType<typeof cheerio.load>): string | undefined {
  const selectors = [
    'h1[itemprop="name"]',
    "h1.recipe-title",
    'h1[class*="recipe"]',
    'h1[class*="title"]',
    "h1",
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
  ];

  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length) {
      const name = selector.startsWith("meta")
        ? element.attr("content")?.trim()
        : element.text().trim();
      if (name) return name;
    }
  }
  return undefined;
}

function extractIngredients($: ReturnType<typeof cheerio.load>): string[] {
  const ingredients: string[] = [];
  const selectors = [
    '[itemprop="recipeIngredient"]',
    ".ingredient",
    ".ingredients li",
    '[class*="ingredient"] li',
    'ul[class*="ingredient"] li',
  ];

  for (const selector of selectors) {
    $(selector).each((_, elem) => {
      const text = $(elem).text().trim();
      if (text && !ingredients.includes(text)) {
        ingredients.push(text);
      }
    });
    if (ingredients.length > 0) break;
  }
  return ingredients;
}

function extractInstructions($: ReturnType<typeof cheerio.load>): string[] {
  const instructions: string[] = [];

  const individualSelectors = [
    '[itemprop="recipeInstructions"] li',
    '[itemprop="recipeInstructions"] > li',
    '[itemprop="recipeInstructions"] p',
    '[itemprop="recipeInstructions"] > p',
    '[itemprop="recipeInstructions"] div[itemprop="recipeInstructions"]',
    ".instructions li",
    ".instructions > li",
    ".instructions p",
    ".instructions > p",
    ".directions li",
    ".directions > li",
    ".directions p",
    '[class*="instruction"] li',
    '[class*="instruction"] > li',
    '[class*="instruction"] p',
    '[class*="direction"] li',
    '[class*="direction"] > li',
    'ol[itemprop="recipeInstructions"] li',
    'ul[itemprop="recipeInstructions"] li',
    ".recipe-instructions li",
    ".recipe-instructions > li",
    ".recipe-directions li",
    ".recipe-directions > li",
  ];

  for (const selector of individualSelectors) {
    $(selector).each((_, elem) => {
      const text = extractCleanText($(elem).clone());
      if (text && text.length > 10) instructions.push(text);
    });
    if (instructions.length > 1) break;
  }

  if (instructions.length <= 1) {
    const containerSelectors = [
      '[itemprop="recipeInstructions"]',
      ".instructions",
      ".directions",
      '[class*="instruction"]',
      '[class*="direction"]',
    ];

    for (const selector of containerSelectors) {
      const $container = $(selector).first();
      if (!$container.length) continue;

      const text = extractCleanText($container.clone());
      if (text.length <= 50) continue;

      const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());
      if (paragraphs.length > 1) {
        instructions.push(
          ...paragraphs.map((p) => p.trim()).filter((p) => p.length > 10)
        );
        break;
      }

      const lines = text.split(/\n/).filter((line) => line.trim().length > 20);
      if (lines.length > 1) {
        instructions.push(...lines.map((line) => line.trim()));
        break;
      }

      if (text.trim().length > 10) {
        instructions.push(text.trim());
        break;
      }
    }
  }

  return instructions;
}

function extractImageUrl($: ReturnType<typeof cheerio.load>): string | undefined {
  const selectors = [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'img[itemprop="image"]',
    ".recipe-image img",
  ];

  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length) {
      const url = selector.startsWith("meta")
        ? element.attr("content")
        : element.attr("src");
      if (url) return url;
    }
  }
  return undefined;
}

export const tryHtmlScraper = async (
  link: string
): Promise<FallbackApiResponse | null> => {
  try {
    const response = await fetchWithTimeout(
      link,
      { headers: BROWSER_HEADERS },
      FETCH_TIMEOUT_MS
    );
    if (!response.ok) return null;

    const $ = cheerio.load(await response.text());
    const name = extractRecipeName($);
    const ingredients = extractIngredients($);
    const instructions = extractInstructions($);
    const imageUrl = extractImageUrl($);

    if (name && ingredients.length > 0 && instructions.length > 0) {
      return {
        name,
        image: imageUrl ? { url: imageUrl } : undefined,
        recipeInstructions: instructions.map((text) => ({
          "@type": "HowToStep" as const,
          text,
        })),
        recipeIngredient: ingredients,
      };
    }

    return null;
  } catch {
    return null;
  }
};
