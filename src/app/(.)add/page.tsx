"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import AddRecipeForm from "~/app/_components/AddRecipeForm";

const Modal = dynamic(
  () => import("~/app/_components/Modal").then((mod) => mod.Modal),
  {
    ssr: false,
    loading: () => null,
  }
);

export default function AddRecipePage() {
  const router = useRouter();

  return (
    <Modal onClose={() => router.back()}>
      <div className="flex h-full w-full flex-col">
        <div className="border-b p-2 text-center text-lg font-bold">
          Add New Recipe
        </div>
        <AddRecipeForm />
      </div>
    </Modal>
  );
}
