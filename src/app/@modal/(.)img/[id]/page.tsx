import { get } from "http";
import { Modal } from "./modal";
import { getRecipe } from "~/server/queries";

export default async function PhotoModal({
	params: { id: photoId },
}: {
	params: { id: string };
}) {
	const recipe = await getRecipe(Number(photoId));
	return (
		<div>
			<img src={recipe.imageUrl} alt="image" className="w-96" />
		</div>
	);
}
