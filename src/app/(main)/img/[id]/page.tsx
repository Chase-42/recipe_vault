import FullImagePageClient from "~/app/_components/FullImagePageClient";

export default async function ImagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idAsNumber = Number.parseInt(id, 10);

  return <FullImagePageClient recipeId={idAsNumber} />;
}
