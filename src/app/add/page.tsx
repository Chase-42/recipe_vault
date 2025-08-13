"use client";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import AddRecipeForm from "~/app/_components/AddRecipeForm";
import {
  PageTransition,
  AnimatedBackButton,
} from "~/components/ui/page-transition";

export default function AddPage() {
  const router = useRouter();

  return (
    <PageTransition>
      <div className="flex h-full min-h-0 w-full min-w-0">
        <div className="flex h-full w-full flex-col">
          <div className="border-b p-2 flex items-center gap-4">
            <AnimatedBackButton className="h-8 w-8 rounded-full bg-transparent hover:bg-accent flex items-center justify-center">
              <ArrowLeft className="h-4 w-4" />
            </AnimatedBackButton>
            <h1 className="text-lg font-bold flex-1 text-center">
              Add New Recipe
            </h1>
            <div className="w-8" /> {/* Spacer for centering */}
          </div>
          <AddRecipeForm />
        </div>
      </div>
    </PageTransition>
  );
}
