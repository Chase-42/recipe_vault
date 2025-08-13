import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Heart, Link, Search } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import RecipeList from "~/app/_components/RecipeList";
import { logger } from "~/lib/logger";
import { getMyRecipes } from "~/server/queries";

const ITEMS_PER_PAGE = 12;

const VaultIcon = ({ className }: { className?: string }) => (
  <svg
    fill="currentColor"
    viewBox="0 0 24 24"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Recipe Vault Logo"
  >
    <path d="M15.935,6.06H8.065a2,2,0,0,0-2,2v6a1.993,1.993,0,0,0,2,2h7.87a2,2,0,0,0,2-2v-6A2.006,2.006,0,0,0,15.935,6.06Zm1,8a1,1,0,0,1-1,1H8.065a.99.99,0,0,1-1-1v-6a1,1,0,0,1,1-1h7.87a1,1,0,0,1,1,1Z" />
    <path d="M18.435,3.06H5.565a2.507,2.507,0,0,0-2.5,2.5v11a2.5,2.5,0,0,0,2.5,2.5v.38a1.5,1.5,0,0,0,1.5,1.5h1.43a1.5,1.5,0,0,0,1.5-1.5v-.38h4v.38a1.5,1.5,0,0,0,1.5,1.5h1.44a1.5,1.5,0,0,0,1.5-1.5v-.38a2.5,2.5,0,0,0,2.5-2.5v-11A2.507,2.507,0,0,0,18.435,3.06ZM8.995,19.44a.5.5,0,0,1-.5.5H7.065a.5.5,0,0,1-.5-.5v-.38h2.43Zm8.44,0a.5.5,0,0,1-.5.5H15.5a.508.508,0,0,1-.5-.5v-.38h2.44Zm2.5-2.88a1.5,1.5,0,0,1-1.5,1.5H5.565a1.5,1.5,0,0,1-1.5-1.5v-11a1.5,1.5,0,0,1,1.5-1.5h12.87a1.5,1.5,0,0,1,1.5,1.5Z" />
    <path d="M14.265,10.56h-.61A1.656,1.656,0,0,0,12.5,9.4V8.79a.491.491,0,0,0-.5-.48.5.5,0,0,0-.5.48V9.4a1.656,1.656,0,0,0-1.16,1.16h-.61a.5.5,0,0,0-.48.5.491.491,0,0,0,.48.5h.61a1.656,1.656,0,0,0,1.16,1.16v.62a.489.489,0,0,0,.5.47.483.483,0,0,0,.5-.47v-.62a1.622,1.622,0,0,0,1.16-1.16h.61a.485.485,0,0,0,.48-.5A.491.491,0,0,0,14.265,10.56ZM12,11.81a.75.75,0,1,1,.75-.75A.749.749,0,0,1,12,11.81Z" />
  </svg>
);

async function RecipeListContainer() {
  const session = await auth();
  const userId = session?.userId;
  if (!userId) return null;

  try {
    // Fetch initial data on server
    const { recipes, total } = await getMyRecipes(userId, {
      offset: 0,
      limit: ITEMS_PER_PAGE,
    });

    const initialData = {
      recipes,
      pagination: {
        total,
        offset: 0,
        limit: ITEMS_PER_PAGE,
        hasNextPage: total > ITEMS_PER_PAGE,
        hasPreviousPage: false,
        totalPages: Math.ceil(total / ITEMS_PER_PAGE),
        currentPage: 1,
      },
    };

    return <RecipeList initialData={initialData} />;
  } catch (error) {
    logger.error(
      "Failed to fetch initial recipes for homepage",
      error instanceof Error ? error : new Error(String(error)),
      {
        component: "RecipeListContainer",
        action: "fetchInitialRecipes",
        userId,
      }
    );
    return <div>Failed to load recipes</div>;
  }
}

const LandingPage = () => (
  <div className="min-h-screen bg-black text-white">
    <header className="border-b border-gray-800/50 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="w-8 h-8 text-white">
            <VaultIcon className="w-full h-full" />
          </div>
          <span className="text-xl font-semibold text-white">Recipe Vault</span>
        </div>
        <SignInButton>
          <Button className="bg-red-600 hover:bg-red-700 text-white border-0 rounded-lg px-6 animate-in fade-in slide-in-from-right-4 duration-700 hover:scale-105 transition-transform">
            Get Started
          </Button>
        </SignInButton>
      </div>
    </header>

    {/* Hero Section */}
    <section className="py-24 lg:py-32">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl lg:text-7xl font-bold text-white mb-8 leading-[1.1] tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-1000">
            The Recipe Manager
            <br />
            <span className="text-red-600 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              You&apos;ve Been Waiting For
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-gray-400 mb-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-500">
            Add your favorite recipes in seconds—simply share a recipe link for
            automatic import of ingredients, instructions, and photos, or
            manually enter your own. Keep all your recipes in one organized
            place, with just the essential details you need. No more endless
            scrolling through life stories or hunting through scattered
            bookmarks to find your favorite dishes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700">
            <SignInButton>
              <Button
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg rounded-lg border-0 hover:scale-105 transition-all duration-200 hover:shadow-lg hover:shadow-red-600/25"
              >
                Start Organizing Recipes
              </Button>
            </SignInButton>
            <SignInButton>
              <Button
                variant="outline"
                size="lg"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 px-8 py-4 text-lg rounded-lg bg-transparent hover:scale-105 transition-all duration-200"
              >
                View Demo
              </Button>
            </SignInButton>
          </div>
        </div>
      </div>
    </section>

    {/* Features Section */}
    <section className="py-24 bg-gray-950/50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 animate-in fade-in slide-in-from-bottom-6 duration-800">
            Everything you need to organize recipes
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-800 delay-200">
            Built for home cooks who want their recipes organized, accessible,
            and clutter-free.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="bg-gray-900/50 border-gray-800/50 hover:border-red-600/30 transition-all duration-300 rounded-xl animate-in fade-in slide-in-from-bottom-8 duration-800 delay-300 hover:scale-105 hover:shadow-xl hover:shadow-red-600/10">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-red-600/20 transition-colors duration-300">
                <Link className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Import from Links
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Paste any recipe URL and automatically extract ingredients,
                instructions, and photos. No manual copying required.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800/50 hover:border-red-600/30 transition-all duration-300 rounded-xl animate-in fade-in slide-in-from-bottom-8 duration-800 delay-500 hover:scale-105 hover:shadow-xl hover:shadow-red-600/10">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-red-600/20 transition-colors duration-300">
                <Search className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Search & Filter
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Find any recipe instantly with powerful search. Filter by
                categories, ingredients, or cooking time.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800/50 hover:border-red-600/30 transition-all duration-300 rounded-xl animate-in fade-in slide-in-from-bottom-8 duration-800 delay-700 hover:scale-105 hover:shadow-xl hover:shadow-red-600/10">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-red-600/20 transition-colors duration-300">
                <Heart className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Save Favorites
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Mark your go-to recipes as favorites for quick access. Build
                your personal collection of must-make dishes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    {/* CTA Section */}
    <section className="py-24">
      <div className="container mx-auto px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-800">
            Ready to organize your recipes?
          </h2>
          <p className="text-xl text-gray-400 mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-800 delay-200">
            Start building your personal recipe collection with Recipe Vault.
          </p>
          <SignInButton>
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white px-12 py-4 text-lg rounded-lg border-0 animate-in fade-in slide-in-from-bottom-4 duration-800 delay-400 hover:scale-105 transition-all duration-200 hover:shadow-lg hover:shadow-red-600/25"
            >
              Get Started Now
            </Button>
          </SignInButton>
        </div>
      </div>
    </section>
  </div>
);

export default function HomePage() {
  return (
    <main>
      <SignedOut>
        <LandingPage />
      </SignedOut>
      <SignedIn>
        <RecipeListContainer />
      </SignedIn>
    </main>
  );
}
