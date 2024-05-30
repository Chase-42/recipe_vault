import { db } from "~/server/db";

const mockUrls = [
	"https://utfs.io/f/c363818d-fd58-4abf-a7a6-0403f67c8166-pet6d2.png",
	"https://utfs.io/f/b287e342-8b0b-4020-a006-aef540dc98f2-pdme8p.png",
	"https://utfs.io/f/a755fecc-4455-458e-8ab3-52137395b6db-pe7gt4.png",
];

const mockImages = mockUrls.map((url, index) => ({
	id: index + 1,
	url,
}));

export default async function HomePage() {
	const recipes = await db.query.recipes.findMany();
	console.log(recipes);

	return (
		<main className="">
			<div className="flex flex-wrap">
				{recipes.map((recipe) => (
					<div key={recipe.id} className="w-1/2 p-2">
						{recipe.instructions}
					</div>
				))}
				{mockImages.map((image) => (
					<div key={image.id} className="w-1/2 p-2">
						<img src={image.url} alt="" />
					</div>
				))}
			</div>
		</main>
	);
}
