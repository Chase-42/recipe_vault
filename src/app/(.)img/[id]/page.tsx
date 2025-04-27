import FullPageImageView from "~/app/_components/FullImagePage";
import { Modal } from "~/app/_components/Modal";

export default async function PhotoModal({
  params,
}: {
  params: { id: string };
}) {
  const awaitedParams = await params;
  const idAsNumber = Number(awaitedParams.id);
  if (Number.isNaN(idAsNumber)) throw new Error("Invalid photo id");

  return (
    <Modal>
      <FullPageImageView id={idAsNumber} />
    </Modal>
  );
}
