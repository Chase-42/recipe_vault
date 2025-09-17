"use client";
import { ShoppingListsViewWithBackButton } from "~/components/shopping-lists/ShoppingListsViewWithBackButton";
import { AuthGuard } from "~/components/auth/AuthGuard";

export default function ShoppingListPage() {
  return (
    <AuthGuard>
      <div className="container py-8">
        <ShoppingListsViewWithBackButton />
      </div>
    </AuthGuard>
  );
}
