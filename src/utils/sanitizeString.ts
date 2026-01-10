const sanitizeString = (str: string | undefined): string => {
  if (!str) return "";

  const cleaned = str
    .replace(/<[^>]+>/g, " ")
    .replace(/&[#\w]+;/g, " ")
    .replace(/https?:\/\/[^\s]+/g, " ")
    .replace(/\b[a-z]+:\/\/[^\s]+/gi, " ")
    .replace(/\b[\w-]+\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?/gi, " ")
    .replace(/\b\d+w\s*,?\s*/gi, " ")
    .replace(/\b(max-width|min-width|100vw|100vh|\d+px)\s*,?\s*/gi, " ")
    .replace(
      /\b(img|decoding|async|width\d+|height\d+|src|srcset|sizes|itemprop|itemscope|itemtype|typeof|property|content|name|id|href|rel|target|title|aria-|data-|class|alt|attachment|feast|content|wide|size)[\w-]*(?=\s|$)/gi,
      " "
    )
    .replace(/[^\w\s.,'’-]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();

  return cleaned;
};

export default sanitizeString;
