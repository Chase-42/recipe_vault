import PrintRecipeClient from "./PrintRecipeClient";

export default async function PrintRecipePage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idAsNumber = Number(id);

  return <PrintRecipeClient id={idAsNumber} />;
}
