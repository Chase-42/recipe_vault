import FullPageImageView from "~/app/_components/FullImagePage";

export default function RecipePage({
	params: { id: photoId },
}: {
	params: { id: string };
}) {
	const idAsNumber = Number(photoId);
	if (Number.isNaN(idAsNumber)) throw new Error("Invalid photo id");
	return (
		<div className="flex h-full min-h-0 w-full min-w-0">
			<FullPageImageView id={idAsNumber} />
		</div>
	);
}
