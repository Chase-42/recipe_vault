import { getServerSession } from "~/lib/auth-helpers";
import { getMyRecipes } from "~/server/queries";
import HomeContent from "./HomeContent";
import type { PaginatedRecipes } from "~/types";

const ITEMS_PER_PAGE = 12;

export default async function HomePage() {
  const session = await getServerSession();

  let initialData: PaginatedRecipes | null = null;

  if (session?.user) {
    try {
      const { recipes, total } = await getMyRecipes(
        session.user.id,
        { offset: 0, limit: ITEMS_PER_PAGE },
        { sortBy: "newest" }
      );

      const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

      initialData = {
        recipes,
        pagination: {
          total,
          offset: 0,
          limit: ITEMS_PER_PAGE,
          hasNextPage: totalPages > 1,
          hasPreviousPage: false,
          totalPages,
          currentPage: 1,
        },
      };
    } catch {
      // If fetching fails, render without initial data
      // Client will fetch on mount
      initialData = null;
    }
  }

  return (
    <HomeContent
      isAuthenticated={!!session?.user}
      initialData={initialData}
    />
  );
}
