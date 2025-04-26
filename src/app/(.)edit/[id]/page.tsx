import { auth } from '@clerk/nextjs/server';
import EditRecipeForm from '~/app/_components/EditRecipeForm';
import { Modal } from '~/app/_components/Modal';
import { getRecipe } from '~/server/queries';
import type { Recipe } from '~/types';

export default async function EditModal({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const userId = session?.userId;
  if (!userId) return null;

  const idAsNumber = Number(params.id);
  if (Number.isNaN(idAsNumber)) throw new Error('Invalid recipe id');

  const recipe: Recipe | null = await getRecipe(idAsNumber, userId);

  if (!recipe) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-xl">Recipe not found.</div>
      </div>
    );
  }

  return (
    <Modal>
      <div className="flex h-full w-full flex-col">
        <div className="border-b p-2 text-center text-lg font-bold">
          Edit Recipe
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <EditRecipeForm initialRecipe={recipe} />
        </div>
      </div>
    </Modal>
  );
}
