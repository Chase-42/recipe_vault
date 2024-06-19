import { getRecipe } from "~/server/queries";

export default async function FullPageImageView(props: { id: number }) {
	const recipe = await getRecipe(props.id);
	return <img src={recipe.imageUrl} alt="image" className="w-96" />;
}
