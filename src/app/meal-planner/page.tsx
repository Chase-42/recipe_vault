"use client";
import { MealPlannerClient } from "./MealPlannerClient";
import { AuthGuard } from "~/components/auth/AuthGuard";

export default function MealPlannerPage() {
  return (
    <AuthGuard>
      <MealPlannerClient />
    </AuthGuard>
  );
}
