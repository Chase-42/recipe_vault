import AddRecipeForm from "~/app/_components/AddRecipeForm";
import { Modal } from "~/app/_components/Modal";

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
