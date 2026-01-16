"use client";
import AddRecipeForm from "~/app/_components/AddRecipeForm";
import { PageTransition } from "~/components/ui/page-transition";
import { TopNav } from "~/app/_components/topnav";

export default function AddPage() {
  return (
    <PageTransition>
      <div className="flex h-full min-h-0 w-full min-w-0">
        <div className="flex h-full w-full flex-col">
          <TopNav
            showBackButton
            showSearch={false}
            showActions={false}
            centerContent={
              <h1 className="text-lg font-bold">Add New Recipe</h1>
            }
          />
          <div className="flex-1 overflow-y-auto">
            <AddRecipeForm />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}