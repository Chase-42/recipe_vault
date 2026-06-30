import { logger } from "~/lib/logger";

const baseUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000/"
    : process.env.NEXT_PUBLIC_DOMAIN;

// Neutral gray SVG used when blur generation fails or no image exists.
// Valid Next.js placeholder="blur" data URL so RecipeCard renders without crashing.
export const FALLBACK_BLUR_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 5'><rect width='8' height='5' fill='#cccccc'/></svg>"
).toString("base64")}`;

const toBase64 = (str: string) =>
  typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);

export async function dynamicBlurDataUrl(url: string): Promise<string> {
  try {
    const res = await fetch(`${baseUrl}/_next/image?url=${url}&w=16&q=75`);
    if (!res.ok) {
      throw new Error(`/_next/image returned ${res.status}`);
    }
    const base64str = Buffer.from(await res.arrayBuffer()).toString("base64");

    const blurSvg = `
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 5'>
        <filter id='b' color-interpolation-filters='sRGB'>
          <feGaussianBlur stdDeviation='1' />
        </filter>

        <image preserveAspectRatio='none' filter='url(#b)' x='0' y='0' height='100%' width='100%'
        href='data:image/avif;base64,${base64str}' />
      </svg>
    `;

    return `data:image/svg+xml;base64,${toBase64(blurSvg)}`;
  } catch (error) {
    logger.warn("dynamicBlurDataUrl failed, using fallback", {
      component: "dynamicBlurDataUrl",
      url,
      error: error instanceof Error ? error.message : String(error),
    });
    return FALLBACK_BLUR_DATA_URL;
  }
}
