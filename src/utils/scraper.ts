import * as cheerio from "cheerio";
import type { FallbackApiResponse } from "~/types";

export const fetchRecipeImages = async (link: string): Promise<string[]> => {
  try {
    const response = await fetch(link);
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
    console.warn("Error fetching recipe images:", error);
    return [];
  }
};

export const tryHtmlScraper = async (
  link: string
): Promise<FallbackApiResponse | null> => {
  try {
    const response = await fetch(link);
    const html = await response.text();
    const $ = cheerio.load(html);

    let name: string | undefined;
    const nameSelectors = [
      'h1[itemprop="name"]',
      'h1.recipe-title',
      'h1[class*="recipe"]',
      'h1[class*="title"]',
      "h1",
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
    ];

    for (const selector of nameSelectors) {
      const element = $(selector).first();
      if (element.length) {
        name =
          selector.startsWith("meta")
            ? element.attr("content")?.trim()
            : element.text().trim();
        if (name) break;
      }
    }

    const ingredients: string[] = [];
    const ingredientSelectors = [
      '[itemprop="recipeIngredient"]',
      '.ingredient',
      '.ingredients li',
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
      $elem.find('img, script, style, noscript, iframe, svg, picture, source').remove();
      $elem.find('[class*="image"], [class*="img"], [class*="photo"], [class*="picture"], [itemprop="image"]').remove();
      
      let html = $elem.html() || '';
      html = html.replace(/<[^>]+>/g, ' ');
      html = html.replace(/&nbsp;/g, ' ');
      html = html.replace(/&amp;/g, '&');
      html = html.replace(/&lt;/g, '<');
      html = html.replace(/&gt;/g, '>');
      html = html.replace(/&quot;/g, '"');
      html = html.replace(/&#39;/g, "'");
      html = html.replace(/&[#\w]+;/g, ' ');
      
      let text = html.trim();
      
      text = text.replace(/\b(img|decoding|async|width\d+|height\d+|src|srcset|sizes|itemprop|itemscope|itemtype|typeof|property|content|name|id|href|rel|target|title|aria-|data-|class|alt|attachment|feast|content|wide|size)[\w-]*(?=\s|$)/gi, '').trim();
      text = text.replace(/https?:\/\/[^\s]+/g, '').trim();
      text = text.replace(/\b[a-z]+:\/\/[^\s]+/gi, '').trim();
      text = text.replace(/\b[\w-]+\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?/gi, '').trim();
      text = text.replace(/\b\d+w\s*,?\s*/gi, '').trim();
      text = text.replace(/\b(max-width|min-width|100vw|100vh|\d+px)\s*,?\s*/gi, '').trim();
      text = text.replace(/\s+/g, ' ').trim();
      
      return text;
    };
    
    const splitIntoSteps = (text: string): string[] => {
      const numberedMatch = text.match(/\d+[\.\)]\s+[A-Z]/g);
      if (numberedMatch && numberedMatch.length > 1) {
        const parts = text.split(/\d+[\.\)]\s+/).filter(p => p.trim());
        if (parts.length > 1) {
          return parts.map(p => p.trim()).filter(p => p.length > 10);
        }
      }
      
      const instructionStarters = [
        'Toast', 'Make', 'Add', 'Combine', 'Mix', 'Stir', 'Pour', 'Heat', 'Cook', 
        'Bake', 'Roast', 'Fry', 'Season', 'Garnish', 'Serve', 'Transfer', 'Place',
        'Blend', 'Fold', 'Whisk', 'Beat', 'Chop', 'Slice', 'Cut', 'Peel', 'Grate',
        'Melt', 'Warm', 'Cool', 'Drain', 'Rinse', 'Pat', 'Dry', 'Soak', 'Marinate',
        'Taste', 'Adjust', 'Finish', 'Top', 'Layer', 'Spread', 'Drizzle', 'Sprinkle',
        'Coat', 'Toss', 'Roll', 'Shape', 'Form', 'Press', 'Flatten', 'Brush', 'Rub',
        'Knead', 'Work', 'Whip', 'Incorporate', 'Scatter', 'Distribute', 'Arrange',
        'Set', 'Put', 'Position', 'Lay', 'Rest', 'Stand', 'Wait', 'Let', 'Allow',
        'Leave', 'Keep', 'Maintain', 'Hold', 'Continue', 'Proceed', 'Move', 'Turn',
        'Flip', 'Rotate', 'Shake'
      ];
      
      const instructionHeaderPattern = new RegExp(
        `\\b(${instructionStarters.join('|')})\\s+(the|it|in|a|an|your|some|all|each|this|that|these|those)\\s+[a-z]+`,
        'gi'
      );
      
      const headerMatches = Array.from(text.matchAll(instructionHeaderPattern));
      if (headerMatches.length > 1 && text.length > 200) {
        const splitPoints: number[] = [0];
        let match;
        const globalPattern = new RegExp(
          `(${instructionStarters.join('|')})\\s+(the|it|in|a|an|your|some|all|each|this|that|these|those|up|together|well|gently|carefully|slowly|quickly)\\s+[a-z]+`,
          'gi'
        );
        
        while ((match = globalPattern.exec(text)) !== null) {
          if (match[0] && match.index !== undefined && match[0]![0] === match[0]![0]!.toUpperCase()) {
            splitPoints.push(match.index);
          }
        }
        
        if (splitPoints.length > 1) {
          const steps: string[] = [];
          for (let i = 0; i < splitPoints.length; i++) {
            const start = splitPoints[i];
            const end = splitPoints[i + 1] || text.length;
            const step = text.slice(start, end).trim();
            if (step.length > 20) {
              steps.push(step);
            }
          }
          
          if (steps.length > 1) {
            return steps;
          }
        }
      }
      
      const starterPattern = new RegExp(
        `(\\.\\s+|^)(${instructionStarters.join('|')})\\s+[a-z]`,
        'gi'
      );
      
      const matches = Array.from(text.matchAll(starterPattern));
      if (matches.length > 1 && text.length > 200) {
        const parts = text.split(new RegExp(
          `\\.\\s+(?=${instructionStarters.join('|')})`,
          'i'
        ));
        
        if (parts.length > 1) {
          const steps = parts.map((p, i) => {
            let step = p.trim();
            if (i < parts.length - 1 && !step.match(/[.!?]$/)) {
              step += '.';
            }
            return step;
          }).filter(p => p.length > 20);
          
          if (steps.length > 1) {
            return steps;
          }
        }
      }
      
      if (text.length > 300) {
        const sentences = text.split(/\.\s+(?=[A-Z][a-z]+)/);
        if (sentences.length > 2) {
          const steps: string[] = [];
          let currentStep = '';
          
          for (const sentence of sentences) {
            const trimmed = sentence.trim();
            if (!trimmed) continue;
            
            const withPeriod = trimmed.endsWith('.') ? trimmed : trimmed + '.';
            
            if (!currentStep || (currentStep.length + withPeriod.length < 250)) {
              currentStep = currentStep ? currentStep + ' ' + withPeriod : withPeriod;
            } else {
              if (currentStep.length > 20) {
                steps.push(currentStep.trim());
              }
              currentStep = withPeriod;
            }
          }
          
          if (currentStep.length > 20) {
            steps.push(currentStep.trim());
          }
          
          if (steps.length > 1) {
            return steps;
          }
        }
      }
      
      return text.length > 10 ? [text] : [];
    };
    
    const individualSelectors = [
      '[itemprop="recipeInstructions"] li',
      '[itemprop="recipeInstructions"] > li',
      '[itemprop="recipeInstructions"] p',
      '.instructions li',
      '.directions li',
      '[class*="instruction"] li',
      '[class*="direction"] li',
      'ol[itemprop="recipeInstructions"] li',
      'ul[itemprop="recipeInstructions"] li',
      '.recipe-instructions li',
      '.recipe-directions li',
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
    
    if (instructions.length <= 1) {
      const containerSelectors = [
        '[itemprop="recipeInstructions"]',
        '.instructions',
        '.directions',
        '[class*="instruction"]',
        '[class*="direction"]',
      ];
      
      for (const selector of containerSelectors) {
        const $container = $(selector).first();
        if ($container.length) {
          const $elem = $container.clone();
          const text = extractCleanText($elem);
          if (text && text.length > 50) {
            const steps = splitIntoSteps(text);
            if (steps.length > 1) {
              instructions.push(...steps);
              break;
            } else if (steps.length === 1 && steps[0]) {
              instructions.push(steps[0]);
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
      '.recipe-image img',
    ];

    for (const selector of imageSelectors) {
      const element = $(selector).first();
      if (element.length) {
        imageUrl =
          selector.startsWith("meta")
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
    console.warn("Error in HTML scraper:", error);
    return null;
  }
};
