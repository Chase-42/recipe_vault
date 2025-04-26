import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Utensils, ChefHat, Clock } from "lucide-react";
import { Suspense } from "react";
import { getMyRecipes } from "~/server/queries";
import { getAuth } from "@clerk/nextjs/server";
import RecipeList from "~/app/_components/RecipeList";
import LoadingSpinner from "~/app/_components/LoadingSpinner";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

const ITEMS_PER_PAGE = 12;

const FloatingIcon = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`absolute animate-float ${className}`}>{children}</div>
  );
};

async function RecipeListContainer() {
  const headersList = await headers();
  const req = new NextRequest("http://localhost", { headers: headersList });
  const { userId } = getAuth(req);
  if (!userId) return null;

  try {
    // Only fetch first page data with explicit caching
    const { recipes, total } = await getMyRecipes(userId, 0, ITEMS_PER_PAGE, {
      cache: "force-cache",
    });
    console.log("Server Data:", { recipes, total, userId });
    return (
      <RecipeList
        initialData={{
          recipes,
          total,
          currentPage: 1,
          totalPages: Math.ceil(total / ITEMS_PER_PAGE),
        }}
      />
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Failed to fetch recipes:", error.message);
    }
    return <div>Failed to load recipes</div>;
  }
}

export default function HomePage() {
  return (
    <main>
      <SignedOut>
        <div className="flex min-h-screen flex-col items-center overflow-hidden bg-background p-8 text-center">
          {/* Floating Icons */}
          <FloatingIcon className="animation-delay-0 left-1/4 top-32 text-muted-foreground opacity-20">
            <ChefHat size={48} />
          </FloatingIcon>
          <FloatingIcon className="animation-delay-1000 right-1/4 top-48 text-muted-foreground opacity-20">
            <Utensils size={48} />
          </FloatingIcon>
          <FloatingIcon className="animation-delay-2000 bottom-32 left-1/3 text-muted-foreground opacity-20">
            <Clock size={48} />
          </FloatingIcon>

          {/* Background Gradient */}
          <div className="fixed inset-x-0 top-0 h-[120vh] animate-pulse-very-slow bg-gradient-to-b from-primary/5 via-primary/5 to-transparent opacity-50 blur-3xl" />

          <div className="relative z-10 max-w-4xl pt-20">
            <div className="pb-8">
              <h1 className="relative mb-6 text-5xl font-bold tracking-tight text-foreground">
                <span className="absolute -bottom-2 left-0 h-1 w-full animate-slide-in bg-primary" />
                <span className="inline-block animate-fade-in-down">
                  Welcome to
                </span>{" "}
                <span className="animation-delay-200 relative inline-block animate-fade-in-down text-primary">
                  Recipe Vault
                </span>
              </h1>

              <div className="animation-delay-400 relative animate-fade-in-up">
                <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  Add your favorite recipes in seconds—simply share a recipe
                  link for automatic import of ingredients, instructions, and
                  photos, or manually enter your own. Keep all your recipes in
                  one organized place, with just the essential details you need.
                  No more endless scrolling through life stories or hunting
                  through scattered bookmarks to find your favorite dishes.
                </p>
              </div>
            </div>

            <div className="animation-delay-600 mt-12 animate-fade-in-up">
              <p className="text-lg text-muted-foreground">
                Please sign in to start saving recipes
              </p>
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <RecipeListContainer />
      </SignedIn>
    </main>
  );
}
