import FullPageImageView from "~/app/_components/FullImagePage";
import { Modal } from "~/app/_components/Modal";

export default async function PhotoModal({
	params: { id: photoId },
}: {
	params: { id: string };
}) {
	const idAsNumber = Number(photoId);
	if (Number.isNaN(idAsNumber)) throw new Error("Invalid photo id");

	return (
		<Modal>
			<FullPageImageView id={Number(photoId)} />
		</Modal>
	);
}
