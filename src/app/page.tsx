import { SignedIn, SignedOut } from "@clerk/nextjs";
import RecipeList from "~/app/_components/RecipeList";

export default async function HomePage() {
  return (
    <main>
      <SignedOut>
        <div className="flex min-h-screen flex-col items-center bg-[hsl(0,0%,3.9%)] p-8 text-center">
          <div className="animate-fadeIn pb-8 pt-12">
            <h1 className="mb-4 text-4xl font-bold tracking-wide text-white transition-colors duration-300 hover:text-[hsl(0,72.2%,50.6%)]">
              Welcome to{" "}
              <span className="text-[hsl(0,72.2%,50.6%)]">Recipe Vault</span>
            </h1>
            <p className="mx-auto max-w-md text-lg text-gray-300">
              Save all your favorite recipes in one place by sharing a recipe
              link. We’ll automatically extract the ingredients, instructions,
              and an image—so you can skip the endless scrolling and focus on
              cooking.
            </p>
          </div>

          <div className="mt-6">
            <p className="text-xl text-[hsl(0,72.2%,50.6%)] transition-colors duration-300 hover:text-white">
              Please sign in to start saving recipes
            </p>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <RecipeList />
      </SignedIn>
    </main>
  );
}
