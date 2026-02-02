"use client";

import AddRecipeForm from "~/app/_components/AddRecipeForm";

export default function AddPage() {
  return (
    <div className="flex h-full min-h-0 w-full min-w-0">
      <div className="flex h-full w-full flex-col">
        <AddRecipeForm />
      </div>
    </div>
  );
}
