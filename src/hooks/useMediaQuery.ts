import { useState, useEffect } from "react";

/**
 * Hook to detect if a media query matches.
 * Returns false during SSR and initial hydration to avoid mismatches.
 */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/**
 * Hook to detect mobile viewport (< 768px).
 * Returns false during SSR.
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

/**
 * Hook for layouts that need more horizontal space (e.g. meal planner sidebar + calendar).
 * Switches to mobile/stacked layout below 1024px.
 */
export function useIsNarrow(): boolean {
  return useMediaQuery("(max-width: 1023px)");
}
