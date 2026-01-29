"use client";

import AddRecipeForm from "~/app/_components/AddRecipeForm";
import { PageTransition } from "~/components/ui/page-transition";

export default function AddPage() {
  return (
    <PageTransition>
      <div className="flex h-full min-h-0 w-full min-w-0">
        <div className="flex h-full w-full flex-col">
          <AddRecipeForm />
        </div>
      </div>
    </PageTransition>
  );
}
