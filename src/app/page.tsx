import { SignedIn, SignedOut } from "@clerk/nextjs";
import RecipeList from "~/app/_components/RecipeList";

export default async function HomePage() {
  return (
    <main className="">
      <SignedOut>
        <div className="mt-3 h-full w-full text-center text-2xl">
          Please sign in to view recipes
        </div>
      </SignedOut>
      <SignedIn>
        <RecipeList />
      </SignedIn>
    </main>
  );
}
