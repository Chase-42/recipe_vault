import * as cheerio from "cheerio";
import type { FallbackApiResponse } from "~/types";

const FETCH_TIMEOUT_MS = 10_000; // 10 seconds

async function fetchWithTimeout(
  url: string,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

export const fetchRecipeImages = async (link: string): Promise<string[]> => {
  try {
    const response = await fetchWithTimeout(link, FETCH_TIMEOUT_MS);
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

export const tryHtmlScraper = async (
  link: string
): Promise<FallbackApiResponse | null> => {
  try {
    const response = await fetchWithTimeout(link, FETCH_TIMEOUT_MS);
    if (!response.ok) {
      return null;
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    let name: string | undefined;
    const nameSelectors = [
      'h1[itemprop="name"]',
      "h1.recipe-title",
      'h1[class*="recipe"]',
      'h1[class*="title"]',
      "h1",
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
    ];

    for (const selector of nameSelectors) {
      const element = $(selector).first();
      if (element.length) {
        name = selector.startsWith("meta")
          ? element.attr("content")?.trim()
          : element.text().trim();
        if (name) break;
      }
    }

    const ingredients: string[] = [];
    const ingredientSelectors = [
      '[itemprop="recipeIngredient"]',
      ".ingredient",
      ".ingredients li",
      '[class*="ingredient"] li',
      'ul[class*="ingredient"] li',
    ];

    for (const selector of ingredientSelectors) {
      $(selector).each((_, elem) => {
        const text = $(elem).text().trim();
        if (text && !ingredients.includes(text)) {
          ingredients.push(text);
        }
      });
      if (ingredients.length > 0) break;
    }

    const instructions: string[] = [];

    const extractCleanText = ($elem: cheerio.Cheerio): string => {
      $elem
        .find("img, script, style, noscript, iframe, svg, picture, source")
        .remove();
      $elem
        .find(
          '[class*="image"], [class*="img"], [class*="photo"], [class*="picture"], [itemprop="image"]'
        )
        .remove();

      let html = $elem.html() ?? "";
      html = html.replace(/<[^>]+>/g, " ");
      html = html.replace(/&nbsp;/g, " ");
      html = html.replace(/&amp;/g, "&");
      html = html.replace(/&lt;/g, "<");
      html = html.replace(/&gt;/g, ">");
      html = html.replace(/&quot;/g, '"');
      html = html.replace(/&#39;/g, "'");
      html = html.replace(/&[#\w]+;/g, " ");

      let text = html.trim();

      text = text
        .replace(
          /\b(img|decoding|async|width\d+|height\d+|src|srcset|sizes|itemprop|itemscope|itemtype|typeof|property|content|name|id|href|rel|target|title|aria-|data-|class|alt|attachment|feast|content|wide|size)[\w-]*(?=\s|$)/gi,
          ""
        )
        .trim();
      text = text.replace(/https?:\/\/[^\s]+/g, "").trim();
      text = text.replace(/\b[a-z]+:\/\/[^\s]+/gi, "").trim();
      text = text
        .replace(/\b[\w-]+\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?/gi, "")
        .trim();
      text = text.replace(/\b\d+w\s*,?\s*/gi, "").trim();
      text = text
        .replace(/\b(max-width|min-width|100vw|100vh|\d+px)\s*,?\s*/gi, "")
        .trim();
      text = text.replace(/\s+/g, " ").trim();

      return text;
    };

    // Try to find individual instruction elements first - scrapers should give us structured data
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
        const $elem = $(elem).clone();
        const text = extractCleanText($elem);
        if (text && text.length > 10) {
          instructions.push(text);
        }
      });
      if (instructions.length > 1) break;
    }

    // If we still don't have structured instructions, try containers
    // But if scrapers gave us something, we should trust it - don't re-split
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
        if ($container.length) {
          const $elem = $container.clone();
          const text = extractCleanText($elem);
          if (text && text.length > 50) {
            // Try to split on double newlines first (paragraphs)
            const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());
            if (paragraphs.length > 1) {
              instructions.push(
                ...paragraphs.map((p) => p.trim()).filter((p) => p.length > 10)
              );
              break;
            }
            // If no paragraphs, try single newlines if substantial
            const lines = text
              .split(/\n/)
              .filter((line) => line.trim().length > 20);
            if (lines.length > 1) {
              instructions.push(...lines.map((line) => line.trim()));
              break;
            }
            // Last resort: return as single instruction - don't try to be too clever
            if (text.trim().length > 10) {
              instructions.push(text.trim());
              break;
            }
          }
        }
      }
    }

    let imageUrl: string | undefined;
    const imageSelectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'img[itemprop="image"]',
      ".recipe-image img",
    ];

    for (const selector of imageSelectors) {
      const element = $(selector).first();
      if (element.length) {
        imageUrl = selector.startsWith("meta")
          ? element.attr("content")
          : element.attr("src");
        if (imageUrl) break;
      }
    }

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
  } catch (error) {
    // Silently fail - this is a fallback operation
    return null;
  }
};
