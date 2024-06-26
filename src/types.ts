export interface Recipe {
	link: string;
	id: number;
	name: string;
	userId: string;
	imageUrl: string;
	blurDataUrl: string;
	instructions: string;
	ingredients: string;
	createdAt: Date;
}
