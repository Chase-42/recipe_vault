import { auth } from "@clerk/nextjs/server";
import FullImagePageClient from "~/app/_components/FullImagePageClient";
import { Modal } from "~/app/_components/Modal";
import { ValidationError } from "~/lib/errors";
import { getRecipe } from "~/server/queries";
import type { Recipe } from "~/types";

export default async function ImageModal({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const userId = session?.userId;
  if (!userId) return null;

  const idAsNumber = Number(params.id);
  if (Number.isNaN(idAsNumber)) throw new ValidationError("Invalid photo id");

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
      <FullImagePageClient id={idAsNumber} />
    </Modal>
  );
}
