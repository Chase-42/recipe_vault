import dynamic from "next/dynamic";
import AddRecipeForm from "~/app/_components/AddRecipeForm";

const Modal = dynamic(
  () => import("~/app/_components/Modal").then((mod) => mod.Modal),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-4 border-t-4 border-red-800" />
      </div>
    ),
  }
);

export default function AddRecipePage() {
  return (
    <Modal>
      <div className="flex h-full w-full flex-col">
        <div className="border-b p-2 text-center text-lg font-bold">
          Add New Recipe
        </div>
        <AddRecipeForm />
      </div>
    </Modal>
  );
}
